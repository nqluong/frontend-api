import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';

// Import services
import { PaymentService } from '../../services/payment.service';
import { BookingService } from '../../services/booking.service';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="page-title" style="background-image: url(assets/customer/images/background/page-title-bg.png);">
      <div class="auto-container">
        <div class="title-outer text-center">
          <h1 class="title">Kết Quả Thanh Toán</h1>
          <ul class="page-breadcrumb">
            <li><a routerLink="/customer">Trang Chủ</a></li>
            <li>Thanh Toán</li>
          </ul>
        </div>
      </div>
    </section>
    
    <section class="result-section pt-60 pb-90">
      <div class="auto-container">
        <div class="row justify-content-center">
          <div class="col-lg-8 text-center">
            <div class="result-box" *ngIf="isProcessing">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang xử lý...</span>
              </div>
              <h3 class="mt-4">Đang xử lý thanh toán</h3>
              <p>Vui lòng đợi trong khi chúng tôi xác nhận thanh toán của bạn...</p>
            </div>
            
            <div class="result-box success-box" *ngIf="!isProcessing && isSuccess">
              <div class="icon-box">
                <i class="fa fa-check-circle"></i>
              </div>
              <h3>Thanh Toán Thành Công</h3>
              <p>Cảm ơn bạn đã đặt phòng tại khách sạn của chúng tôi.</p>
              <div class="booking-info mt-4">
                <div class="info-item">
                  <strong>Mã đặt phòng:</strong> {{bookingId}}
                </div>
                <div class="info-item" *ngIf="roomName">
                  <strong>Phòng:</strong> {{roomName}}
                </div>
                <div class="info-item" *ngIf="amount">
                  <strong>Số tiền thanh toán:</strong> {{formatCurrency(amount)}}
                </div>
              </div>
              <a routerLink="/customer" class="theme-btn btn-style-one mt-4">
                <span class="btn-title">Quay lại trang chủ</span>
              </a>
            </div>
            
            <div class="result-box error-box" *ngIf="!isProcessing && !isSuccess">
              <div class="icon-box">
                <i class="fa fa-times-circle"></i>
              </div>
              <h3>Thanh Toán Thất Bại</h3>
              <p>{{errorMessage || 'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại sau.'}}</p>
              <a routerLink="/customer/checkout" class="theme-btn btn-style-one mt-4">
                <span class="btn-title">Thử lại</span>
              </a>
              <a routerLink="/customer" class="theme-btn btn-style-two mt-4 ms-3">
                <span class="btn-title">Quay lại trang chủ</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .result-box {
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      margin-top: 20px;
    }
    
    .icon-box {
      font-size: 64px;
      margin-bottom: 20px;
    }
    
    .success-box .icon-box {
      color: #28a745;
    }
    
    .error-box .icon-box {
      color: #dc3545;
    }
    
    .booking-info {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      margin-top: 20px;
    }
    
    .info-item {
      margin-bottom: 10px;
    }
  `]
})
export class PaymentResultComponent implements OnInit {
  isProcessing: boolean = true;
  isSuccess: boolean = false;
  errorMessage: string = '';
  
  bookingId: number | null = null;
  roomName: string = '';
  transactionNo: string = '';
  amount: number = 0;
  
  isBrowser: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private bookingService: BookingService,
    private customerService: CustomerService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      console.log('Query parameters received:', params);
      
      // Kiểm tra xem có phải là callback trực tiếp từ VNPAY không
      const vnpResponseCode = params['vnp_ResponseCode'];
      
      if (vnpResponseCode) {
        // Đây là callback trực tiếp từ VNPAY, cần gọi API backend để xử lý
        const allParams = { ...params };
        this.processVnpayCallback(allParams);
      } else {
        // Đây là redirect từ backend sau khi đã xử lý VNPAY
        this.handleBackendRedirect(params);
      }
    });
  }
  
  // Xử lý tham số từ callback trực tiếp của VNPAY
  processVnpayCallback(params: any): void {
    this.isProcessing = true;
    
    // Gọi API backend để xử lý callback
    this.paymentService.handleVnpayCallback(params).subscribe({
      next: (response) => {
        console.log('Backend processed VNPAY callback:', response);
        // Xử lý kết quả từ backend
        this.handleBackendRedirect(response);
      },
      error: (error) => {
        console.error('Error processing VNPAY callback:', error);
        this.isProcessing = false;
        this.isSuccess = false;
        this.errorMessage = 'Không thể xử lý thông tin thanh toán. Vui lòng liên hệ nhân viên hỗ trợ.';
      }
    });
  }
  
  // Xử lý tham số từ backend redirect
  handleBackendRedirect(params: any): void {
    const status = params['status'];
    const message = params['message'];
    const bookingIdStr = params['bookingId'];
    const transactionNo = params['vnp_TransactionNo'] || params['transactionNo'];
    
    console.log('Processing payment result:', { status, message, bookingId: bookingIdStr });
    
    // Xử lý bookingId
    if (bookingIdStr && bookingIdStr.trim() !== '') {
      this.bookingId = Number(bookingIdStr);
      if (isNaN(this.bookingId)) this.bookingId = null;
    }

    // Nếu không có bookingId từ tham số, thử lấy từ localStorage
    if (!this.bookingId && this.isBrowser) {
      this.bookingId = this.bookingService.getBookingId();
      if (!this.bookingId) {
        this.isProcessing = false;
        this.isSuccess = false;
        this.errorMessage = 'Không tìm thấy thông tin đặt phòng';
        return;
      }
    }
    
    // Lưu mã giao dịch nếu có
    if (transactionNo) {
      this.transactionNo = transactionNo;
    }
    
    // Xử lý kết quả thanh toán dựa trên status
    if (status === 'success' || status === '00') {
      this.isSuccess = true;
      // Nếu thanh toán thành công, gửi thông tin khách hàng từ localStorage lên server
      this.submitCustomerInfo();
      // Lấy thêm thông tin chi tiết về đặt phòng
      this.getBookingDetails();
    } else {
      this.isSuccess = false;
      this.isProcessing = false;
      this.errorMessage = message || 'Thanh toán không thành công';
    }
  }
  
  // Lấy thông tin chi tiết về đặt phòng để hiển thị
  getBookingDetails(): void {
    if (!this.bookingId) {
      this.isProcessing = false;
      return;
    }
    
    this.paymentService.getPaymentDetails(this.bookingId)
      .subscribe({
        next: (response) => {
          console.log('Booking details loaded:', response);
          
          if (response && (response.maDatPhong || response.bookingId)) {
            this.roomName = response.phongInfo || response.roomName || '';
            this.amount = response.tongTienThanhToan || response.totalAmount || 0;
          } else if (response && response.status === 200 && response.result) {
            this.roomName = response.result.phongInfo || response.result.roomName || '';
            this.amount = response.result.tongTienThanhToan || response.result.totalAmount || 0;
          }
          
          // Xóa bookingId khỏi localStorage sau khi thanh toán thành công
          if (this.isBrowser && this.isSuccess) {
            this.bookingService.clearBookingId();
          }
          
          this.isProcessing = false;
        },
        error: (error) => {
          console.error('Error loading booking details:', error);
          // Vẫn hiển thị thành công nhưng không có thông tin chi tiết
          this.isProcessing = false;
        }
      });
  }
  
  // Gửi thông tin khách hàng lên server
  submitCustomerInfo(): void {
    if (!this.bookingId || !this.isBrowser) {
      return;
    }
    
    // Lấy thông tin khách hàng từ localStorage
    const storedInfo = this.customerService.getStoredCustomerInfo();
    
    if (storedInfo && storedInfo.bookingId === this.bookingId) {
      // Gửi thông tin khách hàng lên server
      this.customerService.submitCustomerInfo(this.bookingId, storedInfo.customerInfo)
        .subscribe({
          next: (response) => {
            console.log('Customer info submitted successfully:', response);
            // Xóa thông tin khách hàng khỏi localStorage sau khi đã gửi thành công
            this.customerService.clearStoredCustomerInfo();
          },
          error: (error) => {
            console.error('Error submitting customer info:', error);
            // Không hiển thị lỗi cho người dùng vì thanh toán đã thành công
          }
        });
    } else {
      console.log('No customer info found in localStorage or bookingId mismatch');
    }
  }
  
  // Format tiền tệ
  formatCurrency(value: number): string {
    return this.paymentService.formatCurrency(value);
  }
} 