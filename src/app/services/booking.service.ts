import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BookingResponse } from '../models/booking.model';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = 'http://localhost:8080/hotelbooking';

  constructor(private http: HttpClient) { }

  createTemporaryBooking(roomId: number, checkIn: string, checkOut: string): Observable<BookingResponse> {
    const params = {
      roomId: roomId,
      checkIn: checkIn,
      checkOut: checkOut
    };
    return this.http.post<BookingResponse>(`${this.apiUrl}/bookings/temporary`, null, { params });
  }

  cancelBooking(bookingId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/bookings/${bookingId}`);
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
    return this.http.post(`${this.apiUrl}/bookings/${bookingId}/finalize`, {})
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
    return this.http.get(`${this.apiUrl}/bookings/${bookingId}/success`)
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