import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';

// Import models
import { CustomerInfo } from '../../models/customer.model';
import { PaymentDetail } from '../../models/payment.model';

// Import services
import { CustomerService } from '../../services/customer.service';
import { BookingService } from '../../services/booking.service';
import { PaymentService } from '../../services/payment.service';

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
    private customerService: CustomerService,
    private bookingService: BookingService,
    private paymentService: PaymentService,
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
      this.bookingId = this.bookingService.getBookingId();
      if (!this.bookingId) {
        // Không tìm thấy booking, chuyển về trang chủ
        alert('Không tìm thấy thông tin đặt phòng. Vui lòng thử lại.');
        this.router.navigate(['/customer']);
        return;
      }
    }
  }
  
  // Kiểm tra form thông tin khách hàng hợp lệ
  isCustomerInfoValid(): boolean {
    return this.customerService.validateCustomerInfo(this.customerInfo);
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
    
    // Lưu thông tin khách hàng vào localStorage
    if (this.isBrowser) {
      this.customerService.storeCustomerInfo(this.bookingId, this.customerInfo);
    }
    
    // Gửi thông tin khách hàng lên server
    this.customerService.submitCustomerInfo(this.bookingId, this.customerInfo)
      .subscribe({
        next: (response) => {
          console.log('Customer info submitted successfully:', response);
          // Tiếp tục đến bước thanh toán
          this.loadPaymentDetails();
        },
        error: (error) => {
          console.error('Error submitting customer info:', error);
          alert('Có lỗi xảy ra khi gửi thông tin cá nhân: ' + 
            (error.message || 'Vui lòng thử lại sau.'));
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
    
    this.paymentService.getPaymentDetails(this.bookingId)
      .subscribe({
        next: (response) => {
          console.log('Payment details loaded:', response);
          
          // API đang trả về dữ liệu trực tiếp, không có status và result
          if (response && (response.maDatPhong || response.bookingId)) {
            this.paymentDetails = response;
            
            // Kiểm tra và sửa lỗi số ngày thuê nếu cần
            if (this.paymentDetails && this.paymentDetails.soNgayThue && this.paymentDetails.soNgayThue > 100) {
              console.warn('Số ngày thuê bất thường:', this.paymentDetails.soNgayThue);
              
              // Tính lại số ngày từ checkIn và checkOut đã lưu
              if (this.checkIn && this.checkOut) {
                try {
                  const checkInDate = new Date(this.checkIn);
                  const checkOutDate = new Date(this.checkOut);
                  // Tính số ngày giữa hai ngày
                  const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  if (diffDays > 0 && diffDays < 100 && this.paymentDetails) {
                    this.paymentDetails.soNgayThue = diffDays;
                    if (this.paymentDetails.giaPhong) {
                      this.paymentDetails.tongTienPhong = this.paymentDetails.giaPhong * diffDays;
                      this.paymentDetails.tongTienThanhToan = (this.paymentDetails.tongTienPhong || 0) + 
                        (this.paymentDetails.tongTienDichVu || 0);
                    }
                    console.log('Đã sửa số ngày thuê thành:', diffDays);
                  }
                } catch (error) {
                  console.error('Lỗi khi tính toán số ngày thuê:', error);
                }
              }
            }
            
            this.step = 'payment';
          } else if (response && response.status === 200 && response.result) {
            // Trường hợp API trả về trong cấu trúc result
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
    
    this.isCreatingPayment = true;
    
    this.paymentService.createPayment(this.bookingId)
      .subscribe({
        next: (response) => {
          console.log('Payment created:', response);
          
          // Kiểm tra response từ API
          if (response && response.paymentUrl) {
            // Trường hợp API trả về trực tiếp paymentUrl
            if (this.isBrowser) {
              // Lưu bookingId vào localStorage để sử dụng sau khi thanh toán
              const bookingIdValue = this.bookingId as number; // Type assertion để tránh lỗi null
              this.bookingService.saveBookingId(bookingIdValue);
              // Chuyển hướng đến URL thanh toán
              window.location.href = response.paymentUrl;
            }
          } else if (response && response.result && response.result.paymentUrl) {
            // Trường hợp API trả về trong cấu trúc result
            // Lưu paymentId vào localStorage nếu có
            if (this.isBrowser) {
              if (response.result.paymentId) {
                localStorage.setItem('currentPaymentId', response.result.paymentId);
              }
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
}
