import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Customer {
  maKH: number;
  hoTen: string;
  ngaySinh: string;
  gioiTinh: string;
  email: string;
  sdt: string;
  maTK: number;
}

interface ApiResponse<T> {
  status: number;
  time: string;
  message: string;
  result: T;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private apiUrl = 'http://localhost:8080/hotelbooking/customers'; // Cập nhật URL nếu cần

  constructor(private http: HttpClient) {}

  // Gọi API mới để lấy thông tin khách hàng theo mã khách hàng (maKH)
  getCustomerByMaKH(maKH: number): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.apiUrl}/byMaKH/${maKH}`);
  }
}