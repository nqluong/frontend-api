import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';

// Import models
import { CustomerInfo } from '../../models/customer.model';
import { PaymentDetail } from '../../models/payment.model';

// Import services
import { CustomerService } from '../../services/customer.service';
import { BookingService } from '../../services/booking.service';
import { PaymentService } from '../../services/payment.service';
import { ServiceService } from '../../services/service.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  bookingId: number | null = null;
  roomName: string = '';
  checkIn: string = '';
  checkOut: string = '';
  isBrowser: boolean;
  
  customerInfo: CustomerInfo = {
    fullName: '',
    dateOfBirth: '',
    gender: 'Male',
    email: '',
    phone: '',
    createAccount: false,
    username: '',
    password: ''
  };
  
  paymentDetails: PaymentDetail | null = null;
  isLoadingPaymentDetails: boolean = false;
  isSubmittingInfo: boolean = false;
  isCreatingPayment: boolean = false;
  formSubmitted: boolean = false;
  isCreatingAccount: boolean = false;
  canProceedToPayment: boolean = true;
  
  accountCreationSuccess: boolean = false;
  accountCreationMessage: string = '';
  
  // Error messages for form validation
  validationErrors: {
    username: string;
    email: string;
    phone: string;
    password: string;
    general: string;
  } = {
    username: '',
    email: '',
    phone: '',
    password: '',
    general: ''
  };
  
  step: 'info' | 'payment' = 'info';
  
  // Add a new property to track service removal status
  isRemovingService: boolean = false;
  
  constructor(
    private customerService: CustomerService,
    private bookingService: BookingService,
    private paymentService: PaymentService,
    private serviceService: ServiceService,
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Lấy thông tin booking từ navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.bookingId = navigation.extras.state['bookingId'];
      this.roomName = navigation.extras.state['roomName'];
      this.checkIn = navigation.extras.state['checkIn'];
      this.checkOut = navigation.extras.state['checkOut'];
      console.log('Booking info in checkout:', { 
        bookingId: this.bookingId, 
        roomName: this.roomName,
        checkIn: this.checkIn,
        checkOut: this.checkOut
      });
      
      // Save booking details to localStorage
      if (this.isBrowser && this.bookingId) {
        this.saveBookingDetailsToLocalStorage();
      }
    }
  }
  
  ngOnInit(): void {
    // Nếu không có thông tin booking từ navigation state, thử lấy từ localStorage
    if ((!this.bookingId || !this.roomName || !this.checkIn || !this.checkOut) && this.isBrowser) {
      this.loadBookingDetailsFromLocalStorage();
      
      if (!this.bookingId) {
        // Không tìm thấy booking, chuyển về trang chủ
        alert('Không tìm thấy thông tin đặt phòng. Vui lòng thử lại.');
        this.router.navigate(['/customer']);
        return;
      }
    }

    // Try to load previously entered form data if available
    if (this.isBrowser) {
      this.loadSavedFormData();
    }
  }
  
  // Save all booking details to localStorage
  saveBookingDetailsToLocalStorage(): void {
    if (!this.isBrowser || !this.bookingId) return;
    
    try {
      // Make sure dates are in ISO format before saving
      let checkInFormatted = this.checkIn;
      let checkOutFormatted = this.checkOut;
      
      // Ensure dates are in ISO format
      if (this.checkIn && typeof this.checkIn === 'string' && !this.checkIn.includes('T')) {
        // Try to convert to ISO string if not already
        checkInFormatted = new Date(this.checkIn).toISOString();
      }
      
      if (this.checkOut && typeof this.checkOut === 'string' && !this.checkOut.includes('T')) {
        // Try to convert to ISO string if not already
        checkOutFormatted = new Date(this.checkOut).toISOString();
      }
      
      const bookingDetails = {
        bookingId: this.bookingId,
        roomName: this.roomName,
        checkIn: checkInFormatted,
        checkOut: checkOutFormatted
      };
      
      console.log('Saving booking details to localStorage:', bookingDetails);
      localStorage.setItem('currentBookingDetails', JSON.stringify(bookingDetails));
      // Keep the individual bookingId item for backward compatibility
      this.bookingService.saveBookingId(this.bookingId);
    } catch (error) {
      console.error('Error saving booking details to localStorage:', error);
      // Still save the bookingId as fallback
      if (this.bookingId) {
        this.bookingService.saveBookingId(this.bookingId);
      }
    }
  }
  
  // Load all booking details from localStorage
  loadBookingDetailsFromLocalStorage(): void {
    if (!this.isBrowser) return;
    
    // Try to get complete booking details
    const storedDetails = localStorage.getItem('currentBookingDetails');
    if (storedDetails) {
      try {
        const details = JSON.parse(storedDetails);
        this.bookingId = details.bookingId;
        this.roomName = details.roomName || '';
        this.checkIn = details.checkIn || '';
        this.checkOut = details.checkOut || '';
        console.log('Loaded booking details from localStorage:', details);
      } catch (error) {
        console.error('Error parsing stored booking details:', error);
      }
    } else {
      // Fallback to just bookingId if complete details are not available
      this.bookingId = this.bookingService.getBookingId();
    }
  }
  
  // Calculate stay duration correctly
  calculateStayDuration(): number {
    if (!this.checkIn || !this.checkOut) return 0;
    
    try {
      const checkInDate = new Date(this.checkIn);
      const checkOutDate = new Date(this.checkOut);
      
      // Calculate the difference in milliseconds
      const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
      // Convert to days
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays > 0 ? diffDays : 1; // Ensure at least 1 day
    } catch (error) {
      console.error('Error calculating stay duration:', error);
      return 1; // Default to 1 day on error
    }
  }
  
  // Kiểm tra form thông tin khách hàng hợp lệ
  isCustomerInfoValid(): boolean {
    return this.customerService.validateCustomerInfo(this.customerInfo);
  }
  
  // Clear all validation errors
  clearValidationErrors(): void {
    this.validationErrors = {
      username: '',
      email: '',
      phone: '',
      password: '',
      general: ''
    };
  }
  
  // Save form data to localStorage
  saveFormData(): void {
    if (!this.isBrowser) return;
    
    const formData = {
      fullName: this.customerInfo.fullName,
      dateOfBirth: this.customerInfo.dateOfBirth,
      gender: this.customerInfo.gender,
      email: this.customerInfo.email,
      phone: this.customerInfo.phone,
      createAccount: this.customerInfo.createAccount,
      username: this.customerInfo.username,
      password: this.customerInfo.password
    };
    
    localStorage.setItem('checkoutFormData', JSON.stringify(formData));
  }
  
  // Load saved form data from localStorage
  loadSavedFormData(): void {
    const savedData = localStorage.getItem('checkoutFormData');
    if (savedData) {
      try {
        const formData = JSON.parse(savedData);
        this.customerInfo = { ...this.customerInfo, ...formData };
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
  }
  
  // Clear saved form data
  clearSavedFormData(): void {
    if (this.isBrowser) {
      localStorage.removeItem('checkoutFormData');
    }
  }
  
  // Gửi thông tin khách hàng
  submitCustomerInfo(): void {
    this.formSubmitted = true;
    this.clearValidationErrors();
    
    if (!this.isCustomerInfoValid()) {
      alert('Vui lòng điền đầy đủ thông tin cá nhân và đảm bảo thông tin hợp lệ.');
      return;
    }
    
    if (!this.bookingId) {
      alert('Không tìm thấy thông tin đặt phòng. Vui lòng thử lại.');
      return;
    }
    
    // Save form data in case user reloads the page
    this.saveFormData();
    
    this.isSubmittingInfo = true;
    
    // Nếu người dùng chọn tạo tài khoản, kiểm tra và đăng ký tài khoản ngay
    if (this.customerInfo.createAccount) {
      this.createAccountBeforePayment();
    } else {
      // Không tạo tài khoản, chỉ lưu thông tin khách hàng vào localStorage
      this.storeCustomerInfoAndProceed();
    }
  }
  
  // Lưu thông tin khách hàng và chuyển đến bước thanh toán
  storeCustomerInfoAndProceed(): void {
    // Ensure we have a valid bookingId
    if (!this.bookingId) {
      console.error('Missing bookingId when storing customer info');
      alert('Không tìm thấy thông tin đặt phòng. Vui lòng thử lại.');
      return;
    }
    
    // First save booking details to ensure consistency
    this.saveBookingDetailsToLocalStorage();
    
    // Lưu thông tin khách hàng vào localStorage
    if (this.isBrowser) {
      this.customerService.storeCustomerInfo(this.bookingId, this.customerInfo);
      console.log('Đã lưu thông tin khách hàng vào localStorage với bookingId=' + this.bookingId);
    }
    
    // Chuyển ngay đến bước thanh toán
    this.loadPaymentDetails();
  }
  
  // Tạo tài khoản trước khi thanh toán
  createAccountBeforePayment(): void {
    this.clearValidationErrors();
    this.isCreatingAccount = true;
    this.canProceedToPayment = true; // Reset flag
    this.accountCreationSuccess = false;
    this.accountCreationMessage = '';
    
    const accountData = {
      email: this.customerInfo.email,
      username: this.customerInfo.username,
      password: this.customerInfo.password,
      sdt: this.customerInfo.phone
    };
    
    console.log('Creating account with data:', accountData);
    
    this.customerService.createAccount(accountData)
      .pipe(finalize(() => this.isCreatingAccount = false))
      .subscribe({
        next: (response) => {
          console.log('Account creation response:', response);
          
          // Check if response contains any error status despite being in success branch
          if (response && typeof response === 'object' && 'status' in response) {
            if (response.status === 400) {
              console.error('Error in account creation despite being in success callback:', response);
              this.handleAccountCreationErrors({ error: response });
              this.canProceedToPayment = false;
              this.isSubmittingInfo = false;
              return;
            } else if (response.status === 201) {
              console.log('Account created successfully with status 201:', response);
              // Set success message
              this.accountCreationSuccess = true;
              this.accountCreationMessage = response.message || 'Tạo tài khoản thành công';
              
              // If we get here, account creation was successful
              // Store login info for display in payment result
              if (this.isBrowser) {
                this.customerService.storeCustomerInfo(this.bookingId as number, this.customerInfo);
                localStorage.setItem('accountCreated', 'true'); // Set flag for account created
                
                // Optionally store additional account information if needed
                if (response.result && response.result.maTK) {
                  localStorage.setItem('createdAccountId', response.result.maTK.toString());
                }
              }
              
              // Short delay before proceeding to payment to show the success message
              setTimeout(() => {
                // Proceed to payment after account creation
                this.processPaymentAfterAccountCreation();
              }, 1500);
              return;
            }
          }
          
          // For any other unrecognized response format, assume success
          console.warn('Unrecognized account creation response format, assuming success:', response);
          this.accountCreationSuccess = true;
          this.accountCreationMessage = 'Tạo tài khoản thành công';
          
          // Store login info for display in payment result
          if (this.isBrowser) {
            this.customerService.storeCustomerInfo(this.bookingId as number, this.customerInfo);
            localStorage.setItem('accountCreated', 'true'); // Set flag for account created
          }
          
          // Short delay before proceeding to payment
          setTimeout(() => {
            // Proceed to payment after account creation
            this.processPaymentAfterAccountCreation();
          }, 1500);
        },
        error: (error) => {
          console.error('Error creating account:', error);
          this.handleAccountCreationErrors(error);
          // Mark that we can't proceed to payment if account creation fails
          this.canProceedToPayment = false;
          this.isSubmittingInfo = false;
          
          // Scroll to top to show validation errors
          if (this.isBrowser) {
            window.scrollTo(0, 0);
          }
        }
      });
  }
  
  // Xử lý lỗi từ việc tạo tài khoản
  handleAccountCreationErrors(error: any): void {
    // Mặc định message nếu không có chi tiết
    let errorMessage = 'Không thể tạo tài khoản. Vui lòng thử lại sau.';
    
    console.log('Processing account creation error:', error);
    
    // Kiểm tra cấu trúc lỗi từ API
    if (error && error.error) {
      // Nếu error.error là object với status và message
      if (error.error.status === 400 && error.error.message) {
        errorMessage = error.error.message;
        console.log('API validation error message:', errorMessage);
      } 
      // Nếu error.error có message (cấu trúc lỗi khác)
      else if (typeof error.error.message === 'string') {
        errorMessage = error.error.message;
      }
      // Nếu error.error là string
      else if (typeof error.error === 'string') {
        errorMessage = error.error;
      }
    } else if (error && error.message) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object' && 'status' in error && error.status === 400) {
      // Handle the case where the error itself is the response object
      if ('message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
      }
    }
    
    // Reset all validation errors first
    this.clearValidationErrors();
    
    // Phân tích các lỗi cụ thể
    if (errorMessage.includes('Email không hợp lệ') || errorMessage.includes('Email đã được sử dụng')) {
      this.validationErrors.email = errorMessage.includes('Email không hợp lệ') ? 
        'Email không hợp lệ' : 'Email đã được sử dụng';
    }
    
    if (errorMessage.includes('Tên đăng nhập đã tồn tại')) {
      this.validationErrors.username = 'Tên đăng nhập đã tồn tại';
    }
    
    if (errorMessage.includes('Số điện thoại')) {
      this.validationErrors.phone = 'Số điện thoại phải là số và có độ dài từ 9-11 chữ số';
    }
    
    if (errorMessage.includes('Mật khẩu')) {
      this.validationErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    // Nếu không nhận diện được lỗi cụ thể, hiển thị chung
    if (!this.validationErrors.email && 
        !this.validationErrors.username && 
        !this.validationErrors.phone && 
        !this.validationErrors.password) {
      this.validationErrors.general = errorMessage;
    }
    
    // Set this flag to indicate account creation failed
    this.canProceedToPayment = false;
    
    // Ensure we're back on the info step
    this.step = 'info';
    
    // Cuộn lên đầu form để hiển thị lỗi
    if (this.isBrowser) {
      window.scrollTo(0, 0);
    }
  }
  
  // Tải thông tin thanh toán
  loadPaymentDetails(): void {
    if (!this.bookingId) {
      alert('Không tìm thấy thông tin đặt phòng. Vui lòng thử lại.');
      return;
    }
    
    this.isLoadingPaymentDetails = true;
    
    this.paymentService.getPaymentDetails(this.bookingId)
      .subscribe({
        next: (response) => {
          console.log('Payment details loaded:', response);
          
          // API đang trả về dữ liệu trực tiếp, không có status và result
          if (response && (response.maDatPhong || response.bookingId)) {
            this.paymentDetails = response;
            
            // Chỉ sửa lỗi số ngày thuê nếu giá trị từ backend không hợp lệ (>100 hoặc <=0)
            if (this.paymentDetails && this.paymentDetails.soNgayThue && 
                (this.paymentDetails.soNgayThue > 100 || this.paymentDetails.soNgayThue <= 0)) {
              console.warn('Số ngày thuê từ backend không hợp lệ:', this.paymentDetails.soNgayThue);
              
              // Tính lại số ngày từ checkIn và checkOut
              const correctDays = this.calculateStayDuration();
              console.log('Đã tính toán số ngày thuê mới:', correctDays);
              
              if (correctDays > 0 && this.paymentDetails) {
                // Update payment details với số ngày thuê đúng
                this.paymentDetails.soNgayThue = correctDays;
                if (this.paymentDetails.giaPhong) {
                  // Tính lại tổng tiền phòng
                  this.paymentDetails.tongTienPhong = this.paymentDetails.giaPhong * correctDays;
                  // Cập nhật tổng tiền thanh toán
                  this.paymentDetails.tongTienThanhToan = (this.paymentDetails.tongTienPhong || 0) + 
                    (this.paymentDetails.tongTienDichVu || 0);
                }
                console.log('Đã cập nhật thông tin thanh toán với số ngày thuê mới:', this.paymentDetails);
              }
            } else if (this.paymentDetails) {
              console.log('Sử dụng số ngày thuê từ backend:', this.paymentDetails.soNgayThue);
            }
            
            this.step = 'payment';
          } else if (response && response.status === 200 && response.result) {
            // Trường hợp API trả về trong cấu trúc result
            this.paymentDetails = response.result;
            
            // Chỉ kiểm tra giá trị số ngày thuê nếu không hợp lệ từ backend
            if (this.paymentDetails && this.paymentDetails.soNgayThue && 
                (this.paymentDetails.soNgayThue > 100 || this.paymentDetails.soNgayThue <= 0)) {
              console.warn('Số ngày thuê từ backend không hợp lệ:', this.paymentDetails.soNgayThue);
              const correctDays = this.calculateStayDuration();
              if (correctDays > 0 && this.paymentDetails) {
                this.paymentDetails.soNgayThue = correctDays;
                if (this.paymentDetails.giaPhong) {
                  this.paymentDetails.tongTienPhong = this.paymentDetails.giaPhong * correctDays;
                  this.paymentDetails.tongTienThanhToan = (this.paymentDetails.tongTienPhong || 0) + 
                    (this.paymentDetails.tongTienDichVu || 0);
                }
              }
            } else if (this.paymentDetails) {
              console.log('Sử dụng số ngày thuê từ backend:', this.paymentDetails.soNgayThue);
            }
            
            this.step = 'payment';
          } else {
            alert('Không thể tải thông tin thanh toán. Vui lòng thử lại.');
          }
          
          this.isLoadingPaymentDetails = false;
          this.isSubmittingInfo = false;
        },
        error: (error) => {
          console.error('Error loading payment details:', error);
          alert('Có lỗi xảy ra khi tải thông tin thanh toán: ' + 
            (error.message || 'Vui lòng thử lại sau.'));
          this.isLoadingPaymentDetails = false;
          this.isSubmittingInfo = false;
        }
      });
  }
  
  // Tạo thanh toán
  createPayment(): void {
    if (!this.bookingId) {
      alert('Không tìm thấy thông tin đặt phòng. Vui lòng thử lại.');
      return;
    }
    
    // Ensure customer info is properly saved with the correct bookingId before proceeding
    if (this.isBrowser) {
      // Double-check that we have customer info saved
      const storedInfo = this.customerService.getStoredCustomerInfo();
      if (!storedInfo || storedInfo.bookingId !== this.bookingId) {
        console.log('Re-saving customer info before payment to ensure consistency');
        this.customerService.storeCustomerInfo(this.bookingId, this.customerInfo);
      }
    }
    
    this.isCreatingPayment = true;
    
    // Hiển thị thông báo cho người dùng
    console.log('Tạo yêu cầu thanh toán với mã đặt phòng:', this.bookingId);
    
    this.paymentService.createPayment(this.bookingId)
      .subscribe({
        next: (response) => {
          console.log('Payment created:', response);
          
          // Kiểm tra response từ API
          if (response && response.paymentUrl) {
            // Trường hợp API trả về trực tiếp paymentUrl
            if (this.isBrowser) {
              // Lưu booking details vào localStorage để sử dụng sau khi thanh toán
              this.saveBookingDetailsToLocalStorage();
              
              // Xóa dữ liệu form sau khi đã tạo thanh toán thành công và chuyển hướng
              this.clearSavedFormData();
              
              // Thông báo chuyển hướng
              console.log('Chuyển hướng đến cổng thanh toán VNPay...');
              
              // Chuyển hướng đến URL thanh toán
              window.location.href = response.paymentUrl;
            }
          } else if (response && response.result && response.result.paymentUrl) {
            // Trường hợp API trả về trong cấu trúc result
            // Lưu paymentId và bookingId vào localStorage nếu có
            if (this.isBrowser) {
              if (response.result.paymentId) {
                localStorage.setItem('currentPaymentId', response.result.paymentId);
              }
              
              // Lưu thông tin đặt phòng vào localStorage
              this.saveBookingDetailsToLocalStorage();
              
              // Xóa dữ liệu form sau khi đã tạo thanh toán thành công và chuyển hướng
              this.clearSavedFormData();
              
              // Chuyển hướng đến URL thanh toán
              window.location.href = response.result.paymentUrl;
            }
          } else {
            alert('Không thể tạo thanh toán. Vui lòng thử lại.');
            this.isCreatingPayment = false;
          }
        },
        error: (error) => {
          console.error('Error creating payment:', error);
          alert('Có lỗi xảy ra khi tạo thanh toán: ' + 
            (error.message || 'Vui lòng thử lại sau.'));
          this.isCreatingPayment = false;
        }
      });
  }
  
  // Hủy đặt phòng
  cancelBooking(): void {
    if (!this.bookingId) {
      alert('Không tìm thấy thông tin đặt phòng để hủy.');
      return;
    }
    
    if (confirm('Bạn có chắc chắn muốn hủy đặt phòng này không?')) {
      this.bookingService.cancelBooking(this.bookingId)
        .subscribe({
          next: (response: any) => {
            console.log('Booking cancelled successfully:', response);
            alert('Đã hủy đặt phòng thành công.');
            // Xóa dữ liệu booking khỏi localStorage
            if (this.isBrowser) {
              this.bookingService.clearBookingId();
              // Also clear form data when cancelling
              this.clearSavedFormData();
            }
            // Chuyển về trang chủ
            this.router.navigate(['/customer']);
          },
          error: (error) => {
            console.error('Error cancelling booking:', error);
            alert('Có lỗi xảy ra khi hủy đặt phòng. Vui lòng thử lại sau.');
          }
        });
    }
  }
  
  // Format tiền tệ
  formatCurrency(value: number): string {
    return this.paymentService.formatCurrency(value);
  }

  // Process payment after account creation
  processPaymentAfterAccountCreation(): void {
    // Check if we can proceed to payment
    if (!this.canProceedToPayment) {
      this.isSubmittingInfo = false;
      return;
    }
    
    // Ensure we have a valid bookingId
    if (!this.bookingId) {
      console.error('Missing bookingId when processing payment after account creation');
      alert('Không tìm thấy thông tin đặt phòng. Vui lòng thử lại.');
      this.isSubmittingInfo = false;
      return;
    }
    
    // First save booking details to ensure consistency
    this.saveBookingDetailsToLocalStorage();
    
    // Lưu thông tin khách hàng vào localStorage
    if (this.isBrowser) {
      this.customerService.storeCustomerInfo(this.bookingId, this.customerInfo);
      console.log('Đã lưu thông tin khách hàng vào localStorage với bookingId=' + this.bookingId);
    }
    
    // Chuyển ngay đến bước thanh toán
    this.loadPaymentDetails();
  }

  // Method to remove a service from the booking
  removeService(serviceId: number): void {
    if (!this.bookingId) {
      alert('Không tìm thấy thông tin đặt phòng. Không thể xóa dịch vụ.');
      return;
    }
    
    if (!confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      return;
    }
    
    this.isRemovingService = true;
    
    // Build the API endpoint parameters
    const params = new HttpParams()
      .set('maDV', serviceId.toString())
      .set('maDP', this.bookingId.toString());
    
    this.http.delete('http://localhost:8080/hotelbooking/bookservice', { params })
      .pipe(finalize(() => this.isRemovingService = false))
      .subscribe({
        next: (response: any) => {
          console.log('Service removed successfully:', response);
          
          // Check if the response indicates success
          if (response && response.status === 200) {
            alert('Đã xóa dịch vụ thành công.');
            
            // Reload payment details to reflect the changes
            this.loadPaymentDetails();
          } else {
            alert('Có lỗi xảy ra khi xóa dịch vụ. Vui lòng thử lại.');
          }
        },
        error: (error) => {
          console.error('Error removing service:', error);
          alert('Có lỗi xảy ra khi xóa dịch vụ: ' + 
            (error.message || 'Vui lòng thử lại sau.'));
        }
      });
  }
}
