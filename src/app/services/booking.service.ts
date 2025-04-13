import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BookingResponse } from '../models/booking.model';

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
} 