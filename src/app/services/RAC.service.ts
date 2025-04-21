import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RevenueReport {
  labels: string[];
  data: number[];
  totalRevenue: number;
}

export interface RoomPerformanceSummary {
  roomLabels: string[];
  roomData: number[];
  totalBookings: number;
}

@Injectable({
  providedIn: 'root'
})
export class RevenueAnalysisService {
  private apiUrl = 'http://localhost:8080/hotelbooking/revenue';

  constructor(private http: HttpClient) { }

  // Lấy báo cáo doanh thu theo ngày, tháng, năm
  getRevenueReport(type: string = 'MONTHLY'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/report/${type}`);
  }

  // Lấy báo cáo hiệu suất phòng
  getRoomPerformance(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/room-performance`);
  }
}