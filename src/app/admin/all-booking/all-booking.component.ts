import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BookingService, Booking } from '../../services/booking.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-all-booking',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, ReactiveFormsModule],
  providers: [BookingService],
  templateUrl: './all-booking.component.html',
  styleUrls: ['./all-booking.component.css']
})
export class AllBookingComponent implements OnInit {
  bookings: Booking[] = [];
  loading = false;
  error = '';
  currentPage = 0;
  totalPages = 0;
  pageSize = 10;

  constructor(private bookingService: BookingService, private router: Router) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    this.bookingService.getAllBookings(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        if (response && response.result) {
          this.bookings = response.result.content;
          this.totalPages = response.result.totalPages;
        } else {
          this.error = 'Không thể tải danh sách đặt phòng.';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Có lỗi xảy ra khi tải danh sách đặt phòng.';
        console.error('Lỗi:', error);
        this.loading = false;
      }
    });
  }

  viewDetails(maDP: number): void {
    this.router.navigate(['/admin/view-booking', maDP]);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'CANCELLED': return 'bg-danger-light';
      case 'CONFIRMED': return 'bg-success-light';
      case 'PENDING': return 'bg-warning-light';
      default: return 'bg-light';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'CANCELLED': return 'Cancelled';
      case 'CONFIRMED': return 'Confirmed';
      case 'PENDING': return 'Pending';
      default: return status;
    }
  }
  nextPage(): void {
    if (this.currentPage + 1 < this.totalPages) {
      this.currentPage++;
      this.loadBookings();
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadBookings();
    }
  }
}