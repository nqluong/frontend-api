import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookingService, Booking } from '../../services/booking.service';
import { RevenueService } from '../../services/revenue.service';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NgChartsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  // Dữ liệu thống kê
  customerCount: number = 0;
  totalRevenue: number = 0;
  roomCount: number = 0;

  // Danh sách đặt phòng
  bookings: Booking[] = [];

  // Thuộc tính cho biểu đồ
  monthlyRevenueData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Doanh thu',
        fill: false,
        tension: 0.1,
        borderColor: '#009688',
        backgroundColor: 'rgba(0, 150, 136, 0.2)'
      }
    ]
  };

  chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            if (typeof value === 'number') {
              return value.toLocaleString() + ' đ';
            }
            return value;
          }
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString() + ' đ';
            }
            return label;
          }
        }
      }
    }
  };

  constructor(
    private bookingService: BookingService,
    private revenueService: RevenueService
  ) {}

  ngOnInit(): void {
    this.loadTotalRevenue();
    this.loadBookings();
    this.loadMonthlyRevenueData();
  }

  // Lấy tổng doanh thu
  loadTotalRevenue(): void {
    this.revenueService.getRoomPerformance().subscribe({
      next: (response) => {
        if (response && response.result) {
          this.totalRevenue = response.result.totalRevenue;
        }
      },
      error: (error) => {
        console.error('Lỗi khi lấy tổng doanh thu:', error);
      }
    });
  }

  // Lấy danh sách đặt phòng
  loadBookings(): void {
    this.bookingService.getAllBookings(0, 5).subscribe({
      next: (response) => {
        if (response && response.result && response.result.content) {
          this.bookings = response.result.content;
        }
      },
      error: (error) => {
        console.error('Lỗi khi lấy danh sách đặt phòng:', error);
      }
    });
  }

  // Lấy dữ liệu doanh thu theo tháng cho biểu đồ
  loadMonthlyRevenueData(): void {
    this.revenueService.getRevenueReport('MONTHLY').subscribe({
      next: (response) => {
        if (response && response.result && response.result.revenueData) {
          const reportData = response.result.revenueData;
          
          // Cập nhật dữ liệu biểu đồ
          this.monthlyRevenueData.labels = reportData.map(item => {
            const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                              'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
            return monthNames[item.weekOrMonth - 1];
          });
          this.monthlyRevenueData.datasets[0].data = reportData.map(item => item.revenue);
        }
      },
      error: (error) => {
        console.error('Lỗi khi lấy dữ liệu doanh thu theo tháng:', error);
      }
    });
  }

  // Chuyển đổi trạng thái đặt phòng sang badge class
  getStatusBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return 'badge-pill bg-info inv-badge';
      case 'CHECKED_IN':
        return 'badge-pill bg-success inv-badge';
      case 'CHECKED_OUT':
        return 'badge-pill bg-primary inv-badge';
      case 'CANCELLED':
        return 'badge-pill bg-danger inv-badge';
      default:
        return 'badge-pill bg-warning inv-badge';
    }
  }
}