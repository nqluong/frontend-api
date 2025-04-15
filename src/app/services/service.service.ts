import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Service, ServiceResponse, BookingServiceResponse } from '../models/service.model';

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  private apiUrl = 'http://localhost:8080/hotelbooking';

  constructor(private http: HttpClient) { }

  getServices(page: number = 0, size: number = 9): Observable<ServiceResponse> {
    return this.http.get<ServiceResponse>(`${this.apiUrl}/services?page=${page}&size=${size}`);
  }

  addServicesToBooking(bookingId: number, services: { [key: number]: number }): Observable<BookingServiceResponse> {
    return this.http.post<BookingServiceResponse>(
      `${this.apiUrl}/bookings/${bookingId}/services/batch`,
      services
    );
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(value);
  }
} 