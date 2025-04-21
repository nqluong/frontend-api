import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface RoomPerformance {
  roomId: number;
  roomName: string;
  totalBookings: number;
  totalRevenue: number;
  averageStay: number;
}

interface RevenueReport {
  reportType: string;
  revenueData: {
    year: number;
    weekOrMonth: number;
    revenue: number;
    date: string;
  }[];
  roomPerformance: RoomPerformance[];
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
export class RevenueService {
  private apiUrl = 'http://localhost:8080/hotelbooking/revenue'; // Base URL cho API

  constructor(private http: HttpClient) {}

  // Lấy dữ liệu hiệu suất phòng
  getRoomPerformance(): Observable<ApiResponse<{ roomPerformances: RoomPerformance[]; totalRevenue: number; totalBookings: number }>> {
    return this.http.get<ApiResponse<{ roomPerformances: RoomPerformance[]; totalRevenue: number; totalBookings: number }>>(
      `${this.apiUrl}/room-performance`
    );
  }

  // Lấy báo cáo doanh thu theo loại (HÀNG NGÀY, HÀNG TUẦN, HÀNG THÁNG)
  getRevenueReport(type: 'DAILY' | 'WEEKLY' | 'MONTHLY'): Observable<ApiResponse<RevenueReport>> {
    return this.http.get<ApiResponse<RevenueReport>>(`${this.apiUrl}/report/${type}`);
  }
}