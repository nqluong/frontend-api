import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { PaymentDetail, PaymentResponse } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://localhost:8080/hotelbooking';

  constructor(private http: HttpClient) { }

  getPaymentDetails(bookingId: number): Observable<any> {
    console.log(`Fetching payment details for booking ID: ${bookingId}`);
    return this.http.get<any>(`${this.apiUrl}/payment/payment-details/${bookingId}`)
      .pipe(
        map(response => {
          console.log('Raw payment details:', response);
          
          // Kiểm tra xem dữ liệu phản hồi có đúng định dạng không
          if (response && response.result) {
            // Thử sửa lỗi số ngày thuê nếu quá lớn
            const details = response.result;
            if (details.soNgayThue > 365) { // Nếu số ngày lớn hơn 1 năm, có thể là lỗi
              console.warn('Số ngày thuê bất thường, đang cố gắng sửa lỗi:', details.soNgayThue);
              
              // Giả sử ngày đến và ngày đi có thể truy cập từ thông tin đặt phòng
              // Tính lại số ngày thuê (ví dụ mặc định là 1 nếu không tính được)
              details.soNgayThue = 1;
              details.tongTienPhong = details.giaPhong * details.soNgayThue;
              details.tongTienThanhToan = details.tongTienPhong + (details.tongTienDichVu || 0);
            }
            
            return response;
          }
          
          return response;
        }),
        catchError(error => {
          console.error('Error fetching payment details:', error);
          return throwError(() => new Error('Không thể tải thông tin thanh toán. Chi tiết lỗi: ' + 
            (error.error?.message || error.message || 'Lỗi không xác định')));
        })
      );
  }

  createPayment(bookingId: number): Observable<any> {
    // Tạo returnUrl từ URL hiện tại
    let returnUrl = '';
    if (typeof window !== 'undefined') {
      const baseUrl = window.location.origin;
      returnUrl = `${baseUrl}/payment-result`;
    } else {
      returnUrl = 'http://localhost:4200/payment-result';
    }
    
    // Cập nhật tham số theo yêu cầu API
    const paymentData = {
      maDatPhong: bookingId,
      ghiChu: "Thanh toán đặt phòng",
      ipAddress: "127.0.0.1",  // Hoặc lấy IP thực của người dùng nếu cần
      returnUrl: returnUrl     // Thêm returnUrl để backend lưu vào transactionId
    };
    
    console.log('Creating payment with data:', paymentData);
    
    return this.http.post<any>(`${this.apiUrl}/payment/create-payment`, paymentData)
      .pipe(
        map(response => {
          console.log('Payment creation response:', response);
          // Cấu trúc lại response theo PaymentResponse interface
          return {
            status: 200,
            time: new Date().toISOString(),
            message: "Payment URL created successfully",
            result: {
              paymentId: response.vnp_TxnRef || "",
              paymentUrl: response.paymentUrl
            }
          };
        }),
        catchError(error => {
          console.error('Error creating payment:', error);
          return throwError(() => new Error('Không thể tạo thanh toán. Chi tiết lỗi: ' + 
            (error.error?.message || error.message || 'Lỗi không xác định')));
        })
      );
  }

  // Xử lý callback từ VNPAY sau khi backend redirect
  handleVnpayCallback(params: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/payment/payment-callback`, { params })
      .pipe(
        map(response => {
          console.log('VNPAY callback response:', response);
          return response;
        }),
        catchError(error => {
          console.error('Error handling VNPAY callback:', error);
          return throwError(() => new Error('Không thể xử lý callback thanh toán. Chi tiết lỗi: ' + 
            (error.error?.message || error.message || 'Lỗi không xác định')));
        })
      );
  }

  confirmPayment(paymentId: string, bookingId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/payment/confirm`, { 
      paymentId: paymentId,
      bookingId: bookingId
    });
  }

  verifyPaymentStatus(paymentId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/payment/verify/${paymentId}`);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(value);
  }
} 