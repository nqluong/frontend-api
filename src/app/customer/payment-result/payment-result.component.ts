import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';
import { forkJoin } from 'rxjs';

// Import services
import { PaymentService } from '../../services/payment.service';
import { BookingService } from '../../services/booking.service';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-result.component.html',
  styleUrls: ['./payment-result.component.css']
})
export class PaymentResultComponent implements OnInit {
  isProcessing: boolean = true;
  isSuccess: boolean = false;
  errorMessage: string = '';
  accountCreated: boolean = false;
  
  // Booking and payment details
  bookingId: number | null = null;
  bookingDate: string = '';
  roomName: string = '';
  roomNumber: string = '';
  transactionNo: string = '';
  paymentId: string = '';
  amount: number = 0;
  
  // Additional payment details
  roomRate: number = 0;
  stayDuration: number = 0;
  roomAmount: number = 0;
  serviceAmount: number = 0;
  serviceList: any[] = [];
  
  // Check-in/out details
  checkInDate: string = '';
  checkOutDate: string = '';
  
  // Customer details
  customerName: string = '';
  customerEmail: string = '';
  customerPhone: string = '';
  
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
      // và sau đó finalize đặt phòng
      this.processSuccessfulPayment();
      // Lấy thêm thông tin chi tiết về đặt phòng
      this.getBookingDetails();
    } else {
      this.isSuccess = false;
      this.isProcessing = false;
      this.errorMessage = message || 'Thanh toán không thành công';
      
      // Không cần xóa thông tin khách hàng để người dùng có thể thử lại
      console.log('Thanh toán không thành công, giữ thông tin khách hàng trong localStorage để thử lại');
    }
  }
  
  // Lấy thông tin chi tiết về đặt phòng để hiển thị
  getBookingDetails(): void {
    if (!this.bookingId) {
      this.isProcessing = false;
      return;
    }
    
    // Use forkJoin to call both APIs in parallel
    import('rxjs').then(({ forkJoin, of }) => {
      // Ensure we have a valid booking ID number
      if (this.bookingId === null) {
        this.isProcessing = false;
        return;
      }
      
      const bookingIdNumber: number = this.bookingId;
      
      // Get booking success info from the booking API
      const bookingInfo$ = this.bookingService.getBookingSuccessInfo(bookingIdNumber);
      
      // Get payment details from the payment API
      const paymentDetails$ = this.paymentService.getPaymentDetails(bookingIdNumber);
      
      // Combine both responses
      forkJoin({
        bookingInfo: bookingInfo$,
        paymentDetails: paymentDetails$
      }).subscribe({
        next: (combinedResponse) => {
          console.log('Combined API responses:', combinedResponse);
          
          // Extract booking info (customer details, dates, etc.)
          const bookingInfo = combinedResponse.bookingInfo?.result || {};
          // Extract payment details (prices, services, etc.)
          const paymentDetails = combinedResponse.paymentDetails;
          
          // Set customer details from booking info
          this.customerName = bookingInfo.tenKH || '';
          this.customerEmail = bookingInfo.email || '';
          this.customerPhone = bookingInfo.soDienThoai || '';
          
          // Set room info from both APIs
          this.roomName = bookingInfo.tenPhong || paymentDetails.phongInfo || '';
          this.roomNumber = bookingInfo.tenPhong || ''; // Room number is actually the room name from the booking API
          
          // Set dates from booking info
          if (bookingInfo.ngayDen) {
            this.checkInDate = bookingInfo.ngayDen;
          }
          if (bookingInfo.ngayDi) {
            this.checkOutDate = bookingInfo.ngayDi;
          }
          if (bookingInfo.ngayDat) {
            this.bookingDate = bookingInfo.ngayDat;
          }
          
          // Set payment details
          this.amount = paymentDetails.tongTienThanhToan || 0;
          this.roomRate = paymentDetails.giaPhong || 0;
          this.stayDuration = paymentDetails.soNgayThue || 0;
          this.roomAmount = paymentDetails.tongTienPhong || 0;
          this.serviceAmount = paymentDetails.tongTienDichVu || 0;
          this.serviceList = paymentDetails.dichVuList || [];
          
          // Format dates for display
          this.formatDates();
          
          // Xóa bookingId khỏi localStorage sau khi thanh toán thành công
          if (this.isBrowser && this.isSuccess) {
            this.bookingService.clearBookingId();
          }
          
          this.isProcessing = false;
        },
        error: (error) => {
          console.error('Error loading booking details:', error);
          // Try to get at least payment details as fallback
          this.loadPaymentDetailsOnly();
        }
      });
    });
  }
  
  // Fallback method to get at least payment details if the combined approach fails
  loadPaymentDetailsOnly(): void {
    if (!this.bookingId) {
      this.isProcessing = false;
      return;
    }
    
    const bookingIdNumber: number = this.bookingId;
    
    this.paymentService.getPaymentDetails(bookingIdNumber)
      .subscribe({
        next: (response) => {
          console.log('Fallback: Payment details loaded:', response);
          
          if (response && (response.maDatPhong || response.bookingId)) {
            this.roomName = response.phongInfo || response.roomName || '';
            this.amount = response.tongTienThanhToan || response.totalAmount || 0;
            this.roomRate = response.giaPhong || 0;
            this.stayDuration = response.soNgayThue || 0;
            this.roomAmount = response.tongTienPhong || 0;
            this.serviceAmount = response.tongTienDichVu || 0;
            this.serviceList = response.dichVuList || [];
          } else if (response && response.status === 200 && response.result) {
            const result = response.result;
            this.roomName = result.phongInfo || result.roomName || '';
            this.amount = result.tongTienThanhToan || result.totalAmount || 0;
            this.roomRate = result.giaPhong || 0;
            this.stayDuration = result.soNgayThue || 0;
            this.roomAmount = result.tongTienPhong || 0;
            this.serviceAmount = result.tongTienDichVu || 0;
            this.serviceList = result.dichVuList || [];
          }
          
          // Also try to get customer info from localStorage
          if (this.isBrowser) {
            const storedInfo = this.customerService.getStoredCustomerInfo();
            if (storedInfo && storedInfo.bookingId === this.bookingId) {
              this.customerName = this.customerName || storedInfo.customerInfo.fullName;
              this.customerEmail = this.customerEmail || storedInfo.customerInfo.email;
              this.customerPhone = this.customerPhone || storedInfo.customerInfo.phone;
            }
          }
          
          // Format dates if needed
          this.formatDates();
          
          // Xóa bookingId khỏi localStorage sau khi thanh toán thành công
          if (this.isBrowser && this.isSuccess) {
            this.bookingService.clearBookingId();
          }
          
          this.isProcessing = false;
        },
        error: (error) => {
          console.error('Error in fallback loading payment details:', error);
          // Vẫn hiển thị thành công nhưng không có thông tin chi tiết
          this.isProcessing = false;
        }
      });
  }
  
  // Format dates for display
  formatDates(): void {
    try {
      if (this.checkInDate) {
        const checkIn = new Date(this.checkInDate);
        this.checkInDate = checkIn.toLocaleDateString('vi-VN');
      }
      
      if (this.checkOutDate) {
        const checkOut = new Date(this.checkOutDate);
        this.checkOutDate = checkOut.toLocaleDateString('vi-VN');
      }
    } catch (error) {
      console.error('Error formatting dates:', error);
    }
  }
  
  // Xử lý các bước cần thiết sau khi thanh toán thành công
  processSuccessfulPayment(): void {
    if (!this.bookingId || !this.isBrowser) {
      return;
    }
    
    console.log('Thanh toán thành công, bắt đầu xử lý đặt phòng...');
    
    // Lấy thông tin khách hàng từ localStorage
    const storedInfo = this.customerService.getStoredCustomerInfo();
    
    if (storedInfo && storedInfo.bookingId === this.bookingId) {
      // Kiểm tra xem người dùng có chọn tạo tài khoản không
      const isCreatingAccount = storedInfo.customerInfo.createAccount;
      console.log('Khách hàng đã chọn' + (isCreatingAccount ? '' : ' không') + ' tạo tài khoản');
      
      // 1. Gửi thông tin khách hàng lên server
      this.customerService.submitCustomerInfo(this.bookingId, storedInfo.customerInfo)
        .subscribe({
          next: (response) => {
            console.log('Thông tin khách hàng đã được gửi thành công:', response);
            
            if (isCreatingAccount) {
              console.log('Tài khoản đã được tạo thành công với username:', storedInfo.customerInfo.username);
              this.accountCreated = true;
            }
            
            // 2. Finalize đặt phòng sau khi gửi thông tin khách hàng thành công
            this.finalizeBooking();
            
            // Xóa thông tin khách hàng khỏi localStorage sau khi đã gửi thành công
            this.customerService.clearStoredCustomerInfo();
          },
          error: (error) => {
            console.error('Lỗi khi gửi thông tin khách hàng:', error);
            // Vẫn tiếp tục finalize đặt phòng ngay cả khi có lỗi với thông tin khách hàng
            this.finalizeBooking();
          }
        });
    } else {
      console.log('Không tìm thấy thông tin khách hàng trong localStorage hoặc mã đặt phòng không khớp');
      // Vẫn finalize đặt phòng ngay cả khi không có thông tin khách hàng
      this.finalizeBooking();
    }
  }

  // Finalize đặt phòng sau khi thanh toán thành công
  finalizeBooking(): void {
    if (!this.bookingId) {
      console.error('Không thể hoàn tất đặt phòng: Không có mã đặt phòng');
      return;
    }
    
    this.bookingService.finalizeBooking(this.bookingId)
      .subscribe({
        next: (response) => {
          console.log('Đặt phòng đã được hoàn tất thành công:', response);
        },
        error: (error) => {
          console.error('Lỗi khi hoàn tất đặt phòng:', error);
          // Không hiển thị lỗi cho người dùng vì thanh toán đã thành công
        }
      });
  }

  // Format tiền tệ
  formatCurrency(value: number): string {
    return this.paymentService.formatCurrency(value);
  }

  // Không dùng phương thức này nữa, thay bằng processSuccessfulPayment
  // Giữ lại để tương thích ngược nếu cần
  submitCustomerInfo(): void {
    // Method deprecated - using processSuccessfulPayment instead
    if (!this.bookingId || !this.isBrowser) {
      return;
    }
    
    this.processSuccessfulPayment();
  }

  // Add print function for booking details
  printBookingDetails(): void {
    if (!this.isBrowser) return;
    
    const printContents = document.querySelector('.booking-details')?.innerHTML;
    if (!printContents) return;
    
    const originalContents = document.body.innerHTML;
    
    const printCSS = `
      <style>
        @media print {
          body { font-family: Arial, sans-serif; }
          .booking-details { max-width: 800px; margin: 0 auto; }
          .details-heading { color: #333; font-size: 20px; text-align: center; margin-bottom: 5px; }
          .details-note { color: #666; font-size: 14px; text-align: center; margin-bottom: 20px; }
          .details-section { margin-bottom: 20px; }
          .details-section h5 { color: #444; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .booking-info { background: #f8f9fa; border-radius: 8px; padding: 15px; }
          .info-item { margin-bottom: 10px; }
          .print-section { display: none; }
        }
      </style>
    `;
    
    // Create a header with hotel logo/name
    const printHeader = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2>Khách Sạn ABC</h2>
        <p>123 Đường ABC, Thành phố XYZ</p>
        <p>SĐT: 0123 456 789 | Email: info@hotel.com</p>
        <hr>
      </div>
    `;
    
    // Create a document for printing with proper formatting
    const printDocument = `
      <html>
        <head>
          <title>Thông Tin Đặt Phòng #${this.bookingId}</title>
          ${printCSS}
        </head>
        <body>
          ${printHeader}
          <div class="booking-details">
            ${printContents}
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <p>Cảm ơn bạn đã lựa chọn khách sạn của chúng tôi!</p>
          </div>
        </body>
      </html>
    `;
    
    // Open a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Vui lòng cho phép cửa sổ pop-up để in thông tin đặt phòng.');
      return;
    }
    
    printWindow.document.open();
    printWindow.document.write(printDocument);
    printWindow.document.close();
    
    // Wait for resources to load before printing
    printWindow.onload = () => {
      printWindow.print();
      // Don't close the window after printing to allow user to see the preview
    };
  }
} 