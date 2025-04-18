import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Hotel } from '../models/hotels.model';

@Injectable({
  providedIn: 'root'
})
export class HotelsService {

  private apiUrl = 'http://localhost:8080/hotelbooking/hotels'; // Thay bằng URL API của bạn
  
  constructor(private http: HttpClient) {}

  // Hàm lấy danh sách khách sạn
  getHotels(): Observable<{ status: number; result: Hotel[] }> {
    return this.http.get<{ status: number; result: Hotel[] }>(`${this.apiUrl}`);
  }
}
