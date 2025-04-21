import { Component, OnInit } from '@angular/core';
import { RevenueService } from '../../services/revenue.service';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-revenue',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './revenue.component.html',
  styleUrls: ['./revenue.component.css'],
})
export class RevenueComponent implements OnInit {
  roomPerformances: any[] = [];
  totalRevenue: number = 0;
  totalBookings: number = 0;
  revenueReport: any = null;
  error = '';

  constructor(private revenueService: RevenueService) {}

  ngOnInit(): void {
    this.loadRoomPerformance();
    this.loadRevenueReport('DAILY'); // Mặc định lấy báo cáo hàng ngày
  }

  // Lấy hiệu suất phòng
  loadRoomPerformance() {
    this.revenueService.getRoomPerformance().subscribe({
      next: (response) => {
        if (response.status === 200) {
          this.roomPerformances = response.result.roomPerformances;
          this.totalRevenue = response.result.totalRevenue;
          this.totalBookings = response.result.totalBookings;
        } else {
          this.error = response.message;
        }
      },
      error: (err) => {
        console.error('Error loading room performance:', err);
        this.error = 'Có lỗi xảy ra khi tải hiệu suất phòng';
      },
    });
  }

  // Lấy báo cáo doanh thu
  loadRevenueReport(type: 'DAILY' | 'WEEKLY' | 'MONTHLY') {
    this.revenueService.getRevenueReport(type).subscribe({
      next: (response) => {
        if (response.status === 200) {
          this.revenueReport = response.result;
        } else {
          this.error = response.message;
        }
      },
      error: (err) => {
        console.error('Error loading revenue report:', err);
        this.error = 'Có lỗi xảy ra khi tải báo cáo doanh thu';
      },
    });
  }
}