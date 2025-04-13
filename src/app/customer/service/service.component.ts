import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Service {
  maDV: number;
  tenDV: string;
  gia: number;
  moTa: string;
}

interface ServiceResponse {
  status: number;
  time: string;
  result: {
    content: Service[];
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
  }
}

interface BookingServiceResponse {
  status: number;
  time: string;
  message: string;
  result: Array<{
    maDDV: number;
    maBooking: number;
    maDv: number;
    tenDv: string;
    gia: number;
    thanhTien: number;
    soLuong: number;
    thoiGianDat: string;
  }>
}

@Component({
  selector: 'app-service',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './service.component.html',
  styleUrl: './service.component.css'
})
export class ServiceComponent implements OnInit {
  services: Service[] = [];
  currentPage = 0;
  totalPages = 0;
  isLoading = true;
  error = false;
  
  // Thông tin đặt phòng
  bookingId: number | null = null;
  roomName: string = '';
  checkIn: string = '';
  checkOut: string = '';
  
  // Dịch vụ đã chọn
  selectedServices: { [key: number]: number } = {}; // maDV: số lượng
  isAddingServices = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Lấy thông tin booking từ navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.bookingId = navigation.extras.state['bookingId'];
      this.roomName = navigation.extras.state['roomName'];
      this.checkIn = navigation.extras.state['checkIn'];
      this.checkOut = navigation.extras.state['checkOut'];
      console.log('Booking info:', { 
        bookingId: this.bookingId, 
        roomName: this.roomName,
        checkIn: this.checkIn,
        checkOut: this.checkOut
      });
    }
  }

  ngOnInit(): void {
    // Nếu không có thông tin booking từ navigation state, thử lấy từ localStorage
    if (!this.bookingId) {
      const storedBookingId = localStorage.getItem('currentBookingId');
      if (storedBookingId) {
        this.bookingId = parseInt(storedBookingId, 10);
        console.log('Retrieved bookingId from localStorage:', this.bookingId);
      }
    }
    
    this.loadServices();
  }

  loadServices(page: number = 0): void {
    this.isLoading = true;
    this.error = false;
    
    this.http.get<ServiceResponse>(`http://localhost:8080/hotelbooking/services?page=${page}&size=9`)
      .subscribe({
        next: (response) => {
          if (response && response.status === 200 && response.result) {
            this.services = response.result.content;
            this.currentPage = page;
            this.totalPages = response.result.totalPages;
            
          } else {
            console.warn('Cấu trúc response không như mong đợi:', response);
            this.services = [];
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading services:', error);
          this.isLoading = false;
          this.error = true;
          this.services = [];
        }
      });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(value);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.loadServices(page);
    }
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
  
  hasServices(): boolean {
    return Array.isArray(this.services) && this.services.length > 0;
  }
  
  // Thêm dịch vụ vào danh sách đã chọn
  toggleService(serviceId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    
    if (checkbox.checked) {
      // Thêm dịch vụ với số lượng mặc định là 1
      this.selectedServices[serviceId] = 1;
    } else {
      // Xóa dịch vụ khỏi danh sách đã chọn
      delete this.selectedServices[serviceId];
    }
    
    console.log('Selected services:', this.selectedServices);
  }
  
  // Thay đổi số lượng dịch vụ
  updateQuantity(serviceId: number, quantity: number): void {
    if (quantity > 0) {
      this.selectedServices[serviceId] = quantity;
    } else {
      delete this.selectedServices[serviceId];
    }
    
    console.log('Updated services:', this.selectedServices);
  }
  
  // Đặt dịch vụ cho booking hiện tại
  addServicesToBooking(): void {
    // Kiểm tra xem có booking ID không
    if (!this.bookingId) {
      alert('Không tìm thấy thông tin đặt phòng. Vui lòng thử lại.');
      return;
    }
    
    // Kiểm tra xem có dịch vụ được chọn không
    if (Object.keys(this.selectedServices).length === 0) {
      alert('Vui lòng chọn ít nhất một dịch vụ.');
      return;
    }
    
    this.isAddingServices = true;
    
    console.log(`Adding services to booking ${this.bookingId}:`, this.selectedServices);
    
    // Gọi API để thêm dịch vụ vào booking
    this.http.post<BookingServiceResponse>(
      `http://localhost:8080/hotelbooking/bookings/${this.bookingId}/services/batch`,
      this.selectedServices
    ).subscribe({
      next: (response) => {
        console.log('Services added to booking:', response);
        
        if (response && (response.status === 200 || response.status === 201)) {
          // Chuyển hướng đến trang thanh toán
          this.router.navigate(['/customer/checkout'], {
            state: { 
              bookingId: this.bookingId,
              roomName: this.roomName,
              checkIn: this.checkIn,
              checkOut: this.checkOut
            }
          });
        } else {
          alert('Có lỗi xảy ra khi thêm dịch vụ. Vui lòng thử lại.');
        }
        
        this.isAddingServices = false;
      },
      error: (error) => {
        console.error('Error adding services to booking:', error);
        alert('Có lỗi xảy ra khi thêm dịch vụ. Vui lòng thử lại sau.');
        this.isAddingServices = false;
      }
    });
  }
  
  // Bỏ qua bước đặt dịch vụ
  skipServices(): void {
    if (this.bookingId) {
      this.router.navigate(['/customer/checkout'], {
        state: { 
          bookingId: this.bookingId,
          roomName: this.roomName,
          checkIn: this.checkIn,
          checkOut: this.checkOut
        }
      });
    } else {
      alert('Không tìm thấy thông tin đặt phòng. Vui lòng thử lại.');
    }
  }
}
