import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';

interface CustomerInfo {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  createAccount: boolean;
  username: string;
  password: string;
}

interface PaymentDetail {
  bookingId: number;
  roomName: string;
  checkIn: string;
  checkOut: string;
  roomPrice: number;
  totalDays: number;
  services: {
    serviceId: number;
    serviceName: string;
    price: number;
    quantity: number;
    total: number;
  }[];
  totalServiceAmount: number;
  totalAmount: number;
}

interface PaymentResponse {
  status: number;
  time: string;
  message: string;
  result: {
    paymentId: string;
    paymentUrl: string;
  }
}

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
  
  step: 'info' | 'payment' = 'info';
  
  constructor(
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
    }
  }
  
  ngOnInit(): void {
    // Nếu không có thông tin booking từ navigation state, thử lấy từ localStorage
    if (!this.bookingId && this.isBrowser) {
      const storedBookingId = localStorage.getItem('currentBookingId');
      if (storedBookingId) {
        this.bookingId = parseInt(storedBookingId, 10);
        console.log('Retrieved bookingId from localStorage:', this.bookingId);
      } else {
        // Không tìm thấy booking, chuyển về trang chủ
        alert('Không tìm thấy thông tin đặt phòng. Vui lòng thử lại.');
        this.router.navigate(['/customer']);
        return;
      }
    }
  }
  
  // Kiểm tra form thông tin khách hàng hợp lệ
  isCustomerInfoValid(): boolean {
    if (!this.customerInfo.fullName || 
        !this.customerInfo.dateOfBirth || 
        !this.customerInfo.email || 
        !this.customerInfo.phone) {
      return false;
    }
    
    // Kiểm tra email hợp lệ
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.customerInfo.email)) {
      return false;
    }
    
    // Kiểm tra số điện thoại hợp lệ
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(this.customerInfo.phone)) {
      return false;
    }
    
    // Kiểm tra nếu tạo tài khoản thì username và password phải có
    if (this.customerInfo.createAccount) {
      if (!this.customerInfo.username || !this.customerInfo.password || this.customerInfo.password.length < 6) {
        return false;
      }
    }
    
    return true;
  }
  
  // Gửi thông tin khách hàng
  submitCustomerInfo(): void {
    this.formSubmitted = true;
    
    if (!this.isCustomerInfoValid()) {
      alert('Vui lòng điền đầy đủ thông tin cá nhân và đảm bảo thông tin hợp lệ.');
      return;
    }
    
    if (!this.bookingId) {
      alert('Không tìm thấy thông tin đặt phòng. Vui lòng thử lại.');
      return;
    }
    
    this.isSubmittingInfo = true;
    
    // Tách họ và tên từ fullName
    let ho = '';
    let ten = '';
    
    if (this.customerInfo.fullName) {
      const nameParts = this.customerInfo.fullName.trim().split(' ');
      if (nameParts.length > 1) {
        // Lấy phần tử cuối cùng làm tên, các phần tử còn lại làm họ
        ten = nameParts.pop() || '';
        ho = nameParts.join(' ');
      } else {
        // Nếu chỉ có một từ, lấy làm tên
        ten = this.customerInfo.fullName.trim();
      }
    }
    
    // Chuẩn bị dữ liệu theo định dạng mới
    interface CustomerData {
      khachHang: {
        ho: string;
        ten: string;
        ngaySinh: string;
        gioiTinh: string;
        email: string;
        sdt: string;
      };
      taoTaiKhoan: boolean;
      taiKhoan?: {
        username: string;
        password: string;
        email: string;
      };
    }
    
    const customerData: CustomerData = {
      khachHang: {
        ho: ho,
        ten: ten,
        ngaySinh: this.customerInfo.dateOfBirth,
        gioiTinh: this.customerInfo.gender,
        email: this.customerInfo.email,
        sdt: this.customerInfo.phone
      },
      taoTaiKhoan: this.customerInfo.createAccount
    };

    // Nếu tạo tài khoản, thêm thông tin tài khoản
    if (this.customerInfo.createAccount) {
      customerData.taiKhoan = {
        username: this.customerInfo.username,
        password: this.customerInfo.password,
        email: this.customerInfo.email
      };
    }
    
    console.log('Submitting customer info:', customerData);
    
    // Gửi thông tin khách hàng lên server
    this.http.put(`http://localhost:8080/hotelbooking/bookings/${this.bookingId}/customer-info`, customerData)
      .subscribe({
        next: (response: any) => {
          console.log('Customer info submitted successfully:', response);
          // Chuyển sang bước thanh toán
          this.loadPaymentDetails();
        },
        error: (error) => {
          console.error('Error submitting customer info:', error);
          alert('Có lỗi xảy ra khi gửi thông tin khách hàng. Vui lòng thử lại sau.');
          this.isSubmittingInfo = false;
        }
      });
  }
  
  // Tải thông tin thanh toán
  loadPaymentDetails(): void {
    if (!this.bookingId) {
      alert('Không tìm thấy thông tin đặt phòng. Vui lòng thử lại.');
      return;
    }
    
    this.isLoadingPaymentDetails = true;
    
    this.http.get<any>(`http://localhost:8080/hotelbooking/payment/payment-details/${this.bookingId}`)
      .subscribe({
        next: (response) => {
          console.log('Payment details loaded:', response);
          
          if (response && (response.status === 200 || response.status === 201) && response.result) {
            this.paymentDetails = response.result;
            this.step = 'payment';
          } else {
            alert('Không thể tải thông tin thanh toán. Vui lòng thử lại.');
          }
          
          this.isLoadingPaymentDetails = false;
          this.isSubmittingInfo = false;
        },
        error: (error) => {
          console.error('Error loading payment details:', error);
          alert('Có lỗi xảy ra khi tải thông tin thanh toán. Vui lòng thử lại sau.');
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
    
    this.isCreatingPayment = true;
    
    this.http.post<PaymentResponse>(`http://localhost:8080/hotelbooking/payment/create-payment`, { bookingId: this.bookingId })
      .subscribe({
        next: (response) => {
          console.log('Payment created:', response);
          
          if (response && (response.status === 200 || response.status === 201) && response.result && response.result.paymentUrl) {
            // Chuyển hướng đến URL thanh toán
            if (this.isBrowser) {
              window.location.href = response.result.paymentUrl;
            }
          } else {
            alert('Không thể tạo thanh toán. Vui lòng thử lại.');
            this.isCreatingPayment = false;
          }
        },
        error: (error) => {
          console.error('Error creating payment:', error);
          alert('Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại sau.');
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
      this.http.delete(`http://localhost:8080/hotelbooking/bookings/${this.bookingId}`)
        .subscribe({
          next: (response: any) => {
            console.log('Booking cancelled successfully:', response);
            alert('Đã hủy đặt phòng thành công.');
            // Xóa dữ liệu booking khỏi localStorage
            if (this.isBrowser) {
              localStorage.removeItem('currentBookingId');
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
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(value);
  }
}
