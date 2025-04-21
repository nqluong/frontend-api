import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BookingResponse } from '../models/booking.model';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export interface Booking {
  maDP: number;
  maKH: number;
  tenKH: string;
  email: string;
  soDienThoai: string;
  maPhong: number;
  tenPhong: string;
  ngayDat: string;
  ngayDen: string;
  ngayDi: string;
  trangThai: string;
  hoTen: string;
  ngaySinh: string;
  gioiTinh: string;
  sdt: string;
  username: string;
  password: string;
}

interface ApiResponse<T> {
  status: number;
  time: string;
  message: string;
  result: T;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = 'http://localhost:8080/hotelbooking/bookings'; 
  private apiUrl2 = 'http://localhost:8080/hotelbooking';

  constructor(private http: HttpClient) {}

  // Lấy danh sách đặt phòng có phân trang
  getAllBookings(page: number = 0, size: number = 10): Observable<ApiResponse<{
    content: Booking[];
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
  }>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  // Lấy chi tiết đặt phòng theo mã đặt phòng (maDP)
  getBooking(maDP: number): Observable<ApiResponse<Booking>> {
    return this.http.get<ApiResponse<Booking>>(`${this.apiUrl}/${maDP}`);
  }

  // Cập nhật thông tin khách hàng theo mã đặt phòng (maDP)
  updateCustomerInfo(bookingId: number, customerInfo: {
    hoTen: string;
    ngaySinh: string;
    gioiTinh: string;
    email: string;
    sdt: string;
    username: string;
    password: string;
  }): Observable<ApiResponse<Booking>> {
    return this.http.put<ApiResponse<Booking>>(
      `${this.apiUrl}/${bookingId}/customer-info`,
      customerInfo
    );
  }

  checkIn(maDP: number, maGD: string): Observable<ApiResponse<Booking>> {
    return this.http.put<ApiResponse<Booking>>(`${this.apiUrl}/${maDP}/checkin/${maGD}`, {});
  }

  // Chuyển trạng thái đặt phòng sang "Check-out"
  checkOut(maDP: number): Observable<ApiResponse<Booking>> {
    return this.http.put<ApiResponse<Booking>>(`${this.apiUrl}/${maDP}/checkout`, {});
  }
  cancelBooking(maDP: number): Observable<ApiResponse<Booking>> {
    return this.http.put<ApiResponse<Booking>>(`${this.apiUrl}/${maDP}/cancel`, {});
  }


  createTemporaryBooking(roomId: number, checkIn: string, checkOut: string): Observable<BookingResponse> {
    const params = {
      roomId: roomId,
      checkIn: checkIn,
      checkOut: checkOut
    };
    return this.http.post<BookingResponse>(`${this.apiUrl2}/bookings/temporary`, null, { params });
  }

  cancelBooking2(bookingId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl2}/bookings/${bookingId}`);
  }

  // Helper để lưu/lấy bookingId từ localStorage
  saveBookingId(bookingId: number): void {
    localStorage.setItem('currentBookingId', bookingId.toString());
  }

  getBookingId(): number | null {
    const id = localStorage.getItem('currentBookingId');
    return id ? parseInt(id, 10) : null;
  }

  clearBookingId(): void {
    localStorage.removeItem('currentBookingId');
  }
  
  // Helper để lưu/lấy paymentId từ localStorage
  savePaymentId(paymentId: string): void {
    localStorage.setItem('currentPaymentId', paymentId);
  }
  
  getPaymentId(): string | null {
    return localStorage.getItem('currentPaymentId');
  }
  
  clearPaymentId(): void {
    localStorage.removeItem('currentPaymentId');
  }

  // Finalize a booking after successful payment
  finalizeBooking(bookingId: number): Observable<any> {
    return this.http.post(`${this.apiUrl2}/bookings/${bookingId}/finalize`, {})
      .pipe(
        map(response => {
          console.log('Booking finalized successfully:', response);
          return response;
        }),
        catchError(error => {
          console.error('Error finalizing booking:', error);
          return throwError(() => new Error('Không thể hoàn tất đặt phòng. Chi tiết lỗi: ' + 
            (error.error?.message || error.message || 'Lỗi không xác định')));
        })
      );
  }

  // Get booking success information with customer details
  getBookingSuccessInfo(bookingId: number): Observable<any> {
    return this.http.get(`${this.apiUrl2}/bookings/${bookingId}/success`)
      .pipe(
        map(response => {
          console.log('Booking success info loaded:', response);
          return response;
        }),
        catchError(error => {
          console.error('Error loading booking success info:', error);
          return throwError(() => new Error('Không thể tải thông tin đặt phòng. Chi tiết lỗi: ' + 
            (error.error?.message || error.message || 'Lỗi không xác định')));
        })
      );
  }
}

