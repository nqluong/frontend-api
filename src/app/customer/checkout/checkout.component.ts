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
import { AuthService } from '../../services/auth.service';

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
  
  // User account info
  loggedInUser: any = null;
  isLoadingCustomerInfo: boolean = false;
  useAlternativeInfo: boolean = false; // Flag để đánh dấu sử dụng thông tin khác
  
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
    private authService: AuthService,
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
      // Check if user is logged in and get user info
      this.checkUserLoginAndLoadCustomerInfo();
      
      // If no customer info found from account, load saved form data
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
  
  // Check if user is logged in and fetch customer information
  checkUserLoginAndLoadCustomerInfo(): void {
    // Get logged in user information
    this.loggedInUser = this.authService.getUserData();
    
    // If user is logged in, fetch customer info
    if (this.loggedInUser && this.loggedInUser.maTK) {
      console.log('User is logged in with account ID:', this.loggedInUser.maTK);
      this.fetchCustomerInfoFromApi(this.loggedInUser.maTK);
    } else {
      console.log('No logged in user found');
    }
  }

  // Fetch customer information from API using account ID
  fetchCustomerInfoFromApi(accountId: number): void {
    if (!accountId) return;
    
    this.isLoadingCustomerInfo = true;
    
    // API endpoint to get customer info by account ID
    const apiUrl = `http://localhost:8080/hotelbooking/customers/byMaTK/${accountId}`;
    
    this.http.get(apiUrl)
      .pipe(finalize(() => this.isLoadingCustomerInfo = false))
      .subscribe({
        next: (response: any) => {
          console.log('Customer information response:', response);
          
          // Check if we got a valid response with customer data
          if (response && response.status === 200 && response.result) {
            // Extract customer data
            const customerData = response.result;
            
            // Populate the customer info form
            this.populateCustomerInfoForm(customerData);
          } else {
            console.log('No customer information found for this account');
          }
        },
        error: (error) => {
          console.error('Error fetching customer information:', error);
        }
      });
  }

  // Populate form with customer information from API
  populateCustomerInfoForm(customerData: any): void {
    if (!customerData) return;
    
    console.log('Populating form with customer data:', customerData);
    
    // Update the customerInfo object with data from API
    this.customerInfo = {
      ...this.customerInfo,
      fullName: customerData.hoTen || '',
      dateOfBirth: customerData.ngaySinh || '',
      gender: customerData.gioiTinh || 'Nam',
      email: customerData.email || (this.loggedInUser ? this.loggedInUser.email : ''),
      phone: customerData.sdt || (this.loggedInUser ? this.loggedInUser.sdt : ''),
      // Since the user is already logged in, set createAccount to false
      createAccount: false
    };
    
    // Store the customer ID if available for potential updates later
    if (customerData.maKH) {
      localStorage.setItem('customerID', customerData.maKH.toString());
    }
    
    // If we're getting this data from a logged-in account, also store the account ID
    if (this.loggedInUser && this.loggedInUser.maTK) {
      localStorage.setItem('loggedInAccountID', this.loggedInUser.maTK.toString());
    }
  }
  
  // Reset form when user chooses to use alternative info
  toggleAlternativeInfo(): void {
    console.log('Chuyển đổi sử dụng thông tin thay thế:', { 
      useAlternativeInfo: this.useAlternativeInfo,
      loggedIn: !!this.loggedInUser
    });
    
    if (this.useAlternativeInfo) {
      // Khi người dùng chọn sử dụng thông tin người khác, xóa dữ liệu hiện tại
      this.customerInfo = {
        fullName: '',
        dateOfBirth: '',
        gender: 'Nam',
        email: '',
        phone: '',
        createAccount: false,
        username: '',
        password: ''
      };
      
      // Cũng xóa ID khách hàng từ localStorage để tránh cập nhật nhầm
      localStorage.removeItem('customerID');
      console.log('Đã xóa thông tin hiện tại, người dùng sẽ nhập thông tin của người khác');
    } else {
      // Khi người dùng muốn quay lại sử dụng thông tin hiện có
      // Nếu có thông tin từ tài khoản đã đăng nhập, tải lại
      if (this.loggedInUser && this.loggedInUser.maTK) {
        console.log('Quay lại sử dụng thông tin từ tài khoản đăng nhập:', this.loggedInUser.maTK);
        this.fetchCustomerInfoFromApi(this.loggedInUser.maTK);
      } else {
        console.log('Không có thông tin đăng nhập để tải lại');
      }
    }
  }
  
  // Submit customer info (modified to handle updates for existing customers)
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
    
    // Check if this is a logged-in user without customer data
    const loggedInAccountID = localStorage.getItem('loggedInAccountID');
    const existingCustomerID = localStorage.getItem('customerID');
    
    console.log('Thông tin đăng nhập:', { 
      loggedInAccountID, 
      existingCustomerID, 
      useAlternativeInfo: this.useAlternativeInfo,
      createAccount: this.customerInfo.createAccount
    });
    
    // Xử lý theo các trường hợp khác nhau
    if (this.customerInfo.createAccount) {
      // Người dùng muốn tạo tài khoản mới - dùng chung phương thức createAccountBeforePayment
      // Bất kể đã đăng nhập hay chưa
      this.createAccountBeforePayment();
    } else if (loggedInAccountID && !existingCustomerID && !this.useAlternativeInfo) {
      // User is logged in but does not have customer information yet
      // Create customer record and associate with account
      this.createCustomerForExistingAccount(parseInt(loggedInAccountID));
    } else {
      // Regular flow: just store customer info in localStorage and proceed to payment
      // Đảm bảo truyền đúng flag useAlternativeInfo vào storeCustomerInfoAndProceed
      this.storeCustomerInfoAndProceed();
    }
  }
  
  // Create customer information for existing account
  createCustomerForExistingAccount(accountId: number): void {
    console.log('Creating customer information for existing account:', accountId);
    
    // Prepare customer data from the form
    const customerData = {
      hoTen: this.customerInfo.fullName,
      ngaySinh: this.customerInfo.dateOfBirth,
      gioiTinh: this.customerInfo.gender,
      email: this.customerInfo.email,
      sdt: this.customerInfo.phone,
      maTK: accountId
    };
    
    // Create customer information through API
    this.http.post('http://localhost:8080/hotelbooking/customers', customerData)
      .pipe(finalize(() => {}))
      .subscribe({
        next: (response: any) => {
          console.log('Customer creation response:', response);
          
          if (response && response.status === 201 && response.result) {
            // Store the customer ID for future reference
            if (response.result.maKH) {
              localStorage.setItem('customerID', response.result.maKH.toString());
            }
          }
          
          // Continue to payment step regardless of outcome
          this.storeCustomerInfoAndProceed();
        },
        error: (error) => {
          console.error('Error creating customer information:', error);
          // Continue to payment even if there was an error creating customer info
          this.storeCustomerInfoAndProceed();
        }
      });
  }
  
  // Tạo tài khoản trước khi thanh toán
  createAccountBeforePayment(): void {
    this.clearValidationErrors();
    this.isCreatingAccount = true;
    this.canProceedToPayment = true; // Reset flag
    this.accountCreationSuccess = false;
    this.accountCreationMessage = '';
    
    // Chuẩn bị dữ liệu tài khoản
    const accountData = {
      email: this.customerInfo.email,
      username: this.customerInfo.username,
      password: this.customerInfo.password,
      sdt: this.customerInfo.phone,
      // Thêm các thông tin khác để tương thích với RegisterRequest
      role: 'GUEST',
      provider: 'LOCAL',
      providerId: ''
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
              
              // Nếu có mã tài khoản trong kết quả và cần tạo thông tin khách hàng
              if (response.result && response.result.maTK) {
                const newAccountId = response.result.maTK;
                
                // Lưu ID tài khoản mới đã tạo để dùng sau này
                localStorage.setItem('createdAccountId', newAccountId.toString());
                
                // Nếu đã đăng nhập và dùng thông tin người khác
                if (this.loggedInUser && this.useAlternativeInfo) {
                  // KHÔNG tạo thông tin khách hàng ngay tại đây - hãy để backend tự xử lý
                  // khi gọi submitCustomerInfo lúc thanh toán thành công
                  console.log('Đã đăng nhập và dùng thông tin người khác - sẽ tạo thông tin khách hàng sau khi thanh toán');
                  
                  // Lưu flag để biết là đã tạo tài khoản, nhưng chưa tạo thông tin khách hàng
                  localStorage.setItem('accountCreated', 'true');
                  localStorage.setItem('pendingCustomerInfo', 'true');
                } else {
                  // Tạo thông tin khách hàng cho tài khoản mới (trường hợp người dùng chưa đăng nhập)
                  console.log('Tạo thông tin khách hàng cho tài khoản mới (người dùng chưa đăng nhập)');
                  
                  // Tạo thông tin khách hàng cho tài khoản mới này
                  const customerData = {
                    hoTen: this.customerInfo.fullName,
                    ngaySinh: this.customerInfo.dateOfBirth,
                    gioiTinh: this.customerInfo.gender,
                    email: this.customerInfo.email,
                    sdt: this.customerInfo.phone,
                    maTK: newAccountId
                  };
                  
                  // Gọi API để tạo khách hàng cho tài khoản mới
                  this.http.post('http://localhost:8080/hotelbooking/customers', customerData)
                    .subscribe({
                      next: (customerResponse: any) => {
                        console.log('Customer created for new account:', customerResponse);
                      },
                      error: (error) => {
                        console.error('Error creating customer for new account:', error);
                      }
                    });
                }
              }
              
              // If we get here, account creation was successful
              // Store login info for display in payment result
              if (this.isBrowser) {
                this.customerService.storeCustomerInfo(
                  this.bookingId as number, 
                  this.customerInfo,
                  this.useAlternativeInfo
                );
                
                localStorage.setItem('accountCreated', 'true'); // Set flag for account created
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
            this.customerService.storeCustomerInfo(
              this.bookingId as number, 
              this.customerInfo,
              this.useAlternativeInfo
            );
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
  
  // Lưu thông tin khách hàng và chuyển đến bước thanh toán
  storeCustomerInfoAndProceed(): void {
    if (!this.bookingId) {
      console.error('Không thể lưu thông tin: Thiếu bookingId');
      return;
    }
  
    console.log('Lưu thông tin khách hàng với flag useAlternativeInfo =', this.useAlternativeInfo);
    
    // Lưu thông tin vào localStorage
    this.customerService.storeCustomerInfo(
      this.bookingId, 
      this.customerInfo,
      this.useAlternativeInfo // Truyền vào flag đánh dấu đây là thông tin của người khác
    );
  
    // Lưu thêm chi tiết đặt phòng để dễ hiển thị sau này
    this.saveBookingDetailsToLocalStorage();
    
    // Chuyển sang bước thanh toán
    this.step = 'payment';
    
    // Tải thông tin thanh toán
    this.loadPaymentDetails();
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
    
    // Update customer information for logged-in users if needed
    const loggedInAccountID = localStorage.getItem('loggedInAccountID');
    if (loggedInAccountID && !this.useAlternativeInfo) {
      // Chỉ cập nhật thông tin tài khoản nếu người dùng không chọn sử dụng thông tin khác
      this.updateCustomerInfoAfterPayment();
    }
    
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
      this.bookingService.cancelBooking2(this.bookingId)
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

  // After successful payment, update customer information if needed
  updateCustomerInfoAfterPayment(): void {
    // This method can be called after successful payment to ensure customer info is saved
    const loggedInAccountID = localStorage.getItem('loggedInAccountID');
    const existingCustomerID = localStorage.getItem('customerID');
    
    if (loggedInAccountID && existingCustomerID) {
      // Update existing customer info
      const customerData = {
        maKH: parseInt(existingCustomerID),
        hoTen: this.customerInfo.fullName,
        ngaySinh: this.customerInfo.dateOfBirth,
        gioiTinh: this.customerInfo.gender,
        email: this.customerInfo.email,
        sdt: this.customerInfo.phone,
        maTK: parseInt(loggedInAccountID)
      };
      
      this.http.put(`http://localhost:8080/hotelbooking/customers/${existingCustomerID}`, customerData)
        .subscribe({
          next: (response: any) => {
            console.log('Customer info updated after payment:', response);
          },
          error: (error) => {
            console.error('Error updating customer info after payment:', error);
          }
        });
    }
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
}
