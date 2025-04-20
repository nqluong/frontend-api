import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';

// Import models
import { Service } from '../../models/service.model';

// Import services
import { ServiceService } from '../../services/service.service';
import { BookingService } from '../../services/booking.service';

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
  isBrowser: boolean;
  
  // Dịch vụ đã chọn
  selectedServices: { [key: number]: number } = {}; // maDV: số lượng
  isAddingServices = false;
  

  constructor(
    private serviceService: ServiceService,
    private bookingService: BookingService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
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
    if (!this.bookingId && this.isBrowser) {
      this.bookingId = this.bookingService.getBookingId();
      console.log('Retrieved bookingId from localStorage:', this.bookingId);
    }
    
    this.loadServices();
  }

  loadServices(page: number = 0): void {
    this.isLoading = true;
    this.error = false;
    
    this.serviceService.getServices(page)
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
    return this.serviceService.formatCurrency(value);
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
  updateQuantity(serviceId: number, quantity: number | string): void {
    // Ensure quantity is a number
    const numQuantity = typeof quantity === 'string' ? parseInt(quantity, 10) : quantity;
    
    // Validate that we have a valid positive number
    if (!isNaN(numQuantity) && numQuantity > 0) {
      this.selectedServices[serviceId] = numQuantity;
      console.log(`Service ${serviceId} quantity updated to ${numQuantity}`);
    } else if (numQuantity <= 0) {
      // If quantity is zero or negative, remove the service and uncheck the checkbox
      delete this.selectedServices[serviceId];
      
      // Find and uncheck the checkbox
      const checkbox = document.getElementById(`service-toggle-${serviceId}`) as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = false;
      }
      
      console.log(`Service ${serviceId} removed due to zero/negative quantity`);
    } else {
      console.error(`Invalid quantity value: ${quantity}`);
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
    
    // Gọi service để thêm dịch vụ vào booking
    this.serviceService.addServicesToBooking(this.bookingId, this.selectedServices)
      .subscribe({
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
