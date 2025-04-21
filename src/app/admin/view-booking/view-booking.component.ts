import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService, Booking } from '../../services/booking.service';
import { CustomerService } from '../../services/customer.service';
import { CommonModule } from '@angular/common';

interface Customer {
  maKH: number;
  hoTen: string;
  ngaySinh: string;
  gioiTinh: string;
  email: string;
  sdt: string;
  maTK: number;
}

@Component({
  selector: 'app-view-booking',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './view-booking.component.html',
  styleUrls: ['./view-booking.component.css'],
  providers: [BookingService, CustomerService],
})
export class ViewBookingComponent implements OnInit {
  bookingId!: number;
  booking: Booking | null = null;
  customer: Customer | null = null;
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.bookingId = +params['id'];
      if (this.bookingId) {
        this.loadBooking();
      } else {
        this.error = 'Không tìm thấy ID đặt phòng';
        setTimeout(() => {
          this.router.navigate(['/admin/all-booking']);
        }, 2000);
      }
    });
  }

  loadBooking() {
    this.loading = true;
    this.bookingService.getBooking(this.bookingId).subscribe({
      next: (response: any) => {
        console.log('Booking API Response:', response);
        if (response && response.status === 200 && response.result) {
          this.booking = response.result;
          if (this.booking && this.booking.maKH) {
            this.loadCustomer(this.booking.maKH); // Gọi API lấy thông tin khách hàng
          }
        } else {
          this.error = 'Không thể tải thông tin đặt phòng';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Có lỗi xảy ra khi tải thông tin đặt phòng';
        console.error('Lỗi khi tải thông tin đặt phòng:', error);
        this.loading = false;
      },
    });
  }

  loadCustomer(maKH: number) {
    this.customerService.getCustomerByMaKH(maKH).subscribe({
      next: (response: any) => {
        console.log('Customer API Response:', response);
        if (response && response.status === 200 && response.result) {
          this.customer = response.result;
        } else {
          this.error = response.message || 'Không thể tải thông tin khách hàng';
        }
      },
      error: (error) => {
        if (error.status === 404) {
          this.error = `Không tìm thấy khách hàng với mã khách hàng: ${maKH}`;
        } else {
          this.error = 'Có lỗi xảy ra khi tải thông tin khách hàng';
        }
        console.error('Lỗi khi tải thông tin khách hàng:', error);
      },
    });
  }

  cancel() {
    this.router.navigate(['/admin/all-booking']);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'CANCELLED':
        return 'bg-danger text-white';
      case 'CONFIRMED':
        return 'bg-success text-white';
      case 'PENDING':
        return 'bg-warning text-dark';
      default:
        return 'bg-secondary text-white';
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
}