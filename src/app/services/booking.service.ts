import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'http://localhost:8080/hotelbooking/bookings'; // Cập nhật URL cho đúng

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
}