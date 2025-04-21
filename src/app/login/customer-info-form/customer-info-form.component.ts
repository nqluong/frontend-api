import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// Services
import { AuthService } from '../../services/auth.service';
import { ValidationService } from '../../services/validation.service';

@Component({
  selector: 'app-customer-info-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './customer-info-form.component.html',
  styleUrl: './customer-info-form.component.css'
})
export class CustomerInfoFormComponent implements OnInit {
  // Form data
  customerInfo = {
    fullName: '',
    dateOfBirth: '',
    gender: 'Nam',
    email: '',
    phone: ''
  };

  // Account info
  accountId: number | null = null;
  accountEmail: string = '';
  accountPhone: string = '';

  // Status flags
  isLoading: boolean = false;
  isLoadingUserData: boolean = false; // Flag để kiểm tra trạng thái tải dữ liệu người dùng
  errorMessage: string = '';
  successMessage: string = '';
  formSubmitted: boolean = false;

  // Validation errors
  validationErrors = {
    fullName: '',
    dateOfBirth: '',
    email: '',
    phone: ''
  };

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private validationService: ValidationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get account information from local storage
    let userData = this.authService.getUserData();
    
    // Nếu không tìm thấy dữ liệu người dùng, thử lại sau 1 giây
    // (đôi khi dữ liệu chưa được lưu kịp từ quá trình đăng ký/đăng nhập)
    if (!userData) {
      console.log('Không tìm thấy dữ liệu người dùng, thử lại sau 1 giây...');
      this.isLoadingUserData = true;
      
      setTimeout(() => {
        userData = this.authService.getUserData();
        this.isLoadingUserData = false;
        
        if (userData) {
          console.log('Đã tìm thấy dữ liệu người dùng sau khi thử lại:', userData);
          this.accountId = userData.maTK;
          this.accountEmail = userData.email || '';
          this.accountPhone = userData.sdt || '';
          
          // Pre-fill form with account data
          this.customerInfo.email = this.accountEmail;
          this.customerInfo.phone = this.accountPhone;
        } else {
          console.log('Vẫn không tìm thấy dữ liệu người dùng, chuyển hướng đến trang đăng nhập');
          // If no user data after retry, redirect to login
          this.router.navigate(['/login/signin']);
        }
      }, 1000);
      return;
    }
    
    this.accountId = userData.maTK;
    this.accountEmail = userData.email || '';
    this.accountPhone = userData.sdt || '';
    
    // Pre-fill form with account data
    this.customerInfo.email = this.accountEmail;
    this.customerInfo.phone = this.accountPhone;
  }

  // Validate form fields
  validateForm(): boolean {
    this.formSubmitted = true;
    this.validationErrors = {
      fullName: '',
      dateOfBirth: '',
      email: '',
      phone: ''
    };

    let isValid = true;

    // Validate fullName
    if (!this.customerInfo.fullName) {
      this.validationErrors.fullName = 'Vui lòng nhập họ tên';
      isValid = false;
    }

    // Validate dateOfBirth
    if (!this.customerInfo.dateOfBirth) {
      this.validationErrors.dateOfBirth = 'Vui lòng chọn ngày sinh';
      isValid = false;
    } else {
      // Check if date is valid (not in the future)
      const birthDate = new Date(this.customerInfo.dateOfBirth);
      const today = new Date();
      
      if (birthDate > today) {
        this.validationErrors.dateOfBirth = 'Ngày sinh không thể trong tương lai';
        isValid = false;
      }
    }

    // Validate email
    const emailError = this.validationService.getEmailErrorMessage(this.customerInfo.email);
    if (emailError) {
      this.validationErrors.email = emailError;
      isValid = false;
    }

    // Validate phone
    const phoneError = this.validationService.getPhoneErrorMessage(this.customerInfo.phone);
    if (phoneError) {
      this.validationErrors.phone = phoneError;
      isValid = false;
    }

    return isValid;
  }

  // Submit form
  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    if (!this.accountId) {
      this.errorMessage = 'Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Prepare data for API
    const customerData = {
      hoTen: this.customerInfo.fullName,
      ngaySinh: this.customerInfo.dateOfBirth,
      gioiTinh: this.customerInfo.gender,
      email: this.customerInfo.email,
      sdt: this.customerInfo.phone,
      maTK: this.accountId
    };

    // Send data to API
    this.http.post('http://localhost:8080/hotelbooking/customers', customerData)
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response && (response.status === 200 || response.status === 201)) {
            this.successMessage = 'Thông tin cá nhân đã được lưu thành công!';
            // Redirect to homepage after 2 seconds
            setTimeout(() => {
              this.router.navigate(['/customer']);
            }, 2000);
          } else {
            this.errorMessage = response?.message || 'Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại sau.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error?.error?.message || 'Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại sau.';
        }
      });
  }

  // Skip form completion and go to homepage
  skipForm(): void {
    if (confirm('Bạn có chắc muốn bỏ qua việc nhập thông tin? Bạn có thể cập nhật thông tin này sau trong hồ sơ cá nhân.')) {
      this.router.navigate(['/customer']);
    }
  }
}
