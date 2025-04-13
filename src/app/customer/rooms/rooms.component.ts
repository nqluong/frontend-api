import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';

// Import models
import { RoomDisplay } from '../../models/booking.model';

// Import services
import { BookingService } from '../../services/booking.service';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.css'
})
export class RoomsComponent implements OnInit {
  searchResults: RoomDisplay[] = [];
  checkInDate: string = '';
  checkOutDate: string = '';
  isCreatingBooking: boolean = false;
  isBrowser: boolean;

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private bookingService: BookingService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Lấy dữ liệu từ navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.searchResults = navigation.extras.state['searchResults'];
      this.checkInDate = navigation.extras.state['checkIn'];
      this.checkOutDate = navigation.extras.state['checkOut'];
      console.log('Navigation state data:', this.searchResults);
      console.log('Check-in date:', this.checkInDate);
      console.log('Check-out date:', this.checkOutDate);
    }
  }

  ngOnInit() {
    // Backup plan: Nếu không lấy được từ navigation state, thử lấy từ history state
    if (this.isBrowser && this.searchResults.length === 0 && window.history.state?.searchResults) {
      this.searchResults = window.history.state.searchResults;
      this.checkInDate = window.history.state.checkIn;
      this.checkOutDate = window.history.state.checkOut;
      console.log('History state data:', this.searchResults);
    }
  }

  // Kiểm tra và sửa định dạng ngày tháng nếu cần
  fixDateFormat(dateString: string): string {
    if (!dateString) return '';
    
    // Kiểm tra xem ngày có phải là năm cũ kỳ lạ không (ví dụ: 1915, 1917)
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      
      // Nếu năm < 2000, đây có thể là lỗi định dạng
      if (year < 2000) {
        // Lấy ngày hiện tại
        const today = new Date();
        
        // Tìm thông tin ngày, tháng từ chuỗi gốc
        const parts = dateString.split('T')[0].split('-');
        if (parts.length === 3) {
          const day = parseInt(parts[2]);
          const month = parseInt(parts[1]);
          
          // Tạo ngày mới với năm hiện tại
          const fixedDate = new Date(today.getFullYear(), month - 1, day);
          
          // Format lại theo ISO 8601 với timezone +07:00
          return fixedDate.toISOString().replace('Z', '+07:00');
        }
      }
      
      // Nếu không có vấn đề, giữ nguyên chuỗi
      return dateString;
    } catch (error) {
      console.error('Error parsing date:', error);
      return dateString;
    }
  }

  bookRoom(roomId: number) {
    if (this.isCreatingBooking) {
      return; // Tránh gửi nhiều request cùng lúc
    }

    if (!this.checkInDate || !this.checkOutDate) {
      alert('Không tìm thấy thông tin ngày check-in và check-out. Vui lòng quay lại trang tìm kiếm.');
      return;
    }

    this.isCreatingBooking = true;

    // Sửa lại định dạng ngày nếu cần
    const checkInFixed = this.fixDateFormat(this.checkInDate);
    const checkOutFixed = this.fixDateFormat(this.checkOutDate);

    console.log('Creating temporary booking with params:', {
      roomId: roomId,
      checkIn: checkInFixed,
      checkOut: checkOutFixed
    });

    // Sử dụng service để tạo đặt phòng tạm thời
    this.bookingService.createTemporaryBooking(roomId, checkInFixed, checkOutFixed)
      .subscribe({
        next: (response) => {
          console.log('Temporary booking created:', response);
          if (response && (response.status === 200 || response.status === 201) && response.result) {
            // Lưu mã đặt phòng vào localStorage để sử dụng cho các bước tiếp theo
            if (this.isBrowser) {
              this.bookingService.saveBookingId(response.result.maDP);
            }
            
            // Chuyển hướng đến trang dịch vụ
            this.router.navigate(['/customer/service'], {
              state: { 
                bookingId: response.result.maDP,
                roomName: response.result.tenPhong,
                checkIn: response.result.ngayDen,
                checkOut: response.result.ngayDi
              }
            });
          } else {
            alert('Có lỗi xảy ra khi tạo đơn đặt phòng. Vui lòng thử lại.');
          }
          this.isCreatingBooking = false;
        },
        error: (error) => {
          console.error('Error creating temporary booking:', error);
          alert('Có lỗi xảy ra khi tạo đơn đặt phòng. Vui lòng thử lại sau.');
          this.isCreatingBooking = false;
        }
      });
  }
}
