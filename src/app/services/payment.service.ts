import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentDetail, PaymentResponse } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://localhost:8080/hotelbooking';

  constructor(private http: HttpClient) { }

  getPaymentDetails(bookingId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/payment/payment-details/${bookingId}`);
  }

  createPayment(bookingId: number): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/payment/create-payment`, { bookingId });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(value);
  }
} 