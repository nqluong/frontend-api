import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { RoomService } from '../../services/room.service';
import { Room } from '../../models/room.model';
import { BookingService } from '../../services/booking.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-room-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './room-details.component.html',
  styleUrl: './room-details.component.css'
})
export class RoomDetailsComponent implements OnInit {
  roomId!: number;
  room: Room | null = null;
  isLoading = true;
  errorMessage = '';
  selectedImage: string | null = null; // Thêm thuộc tính để theo dõi ảnh đang được chọn
  
  // Booking form data
  bookingData = {
    checkIn: '',
    checkOut: ''
  };
  isCreatingBooking = false;

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService,
    private bookingService: BookingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get the room ID from the route parameters
    this.route.params.subscribe(params => {
      this.roomId = +params['id']; // Convert string to number
      this.loadRoomDetails();
    });
    
    // Get check-in and check-out dates from query parameters if available
    this.route.queryParams.subscribe(params => {
      if (params['checkIn']) {
        this.bookingData.checkIn = params['checkIn'];
      }
      if (params['checkOut']) {
        this.bookingData.checkOut = params['checkOut'];
      }
    });
  }

  // Phương thức chọn ảnh
  selectImage(image: string): void {
    this.selectedImage = image;
  }

  loadRoomDetails(): void {
    this.isLoading = true;
    this.roomService.getRoomById(this.roomId).subscribe({
      next: (response) => {
        if (response && response.status === 200 && response.result) {
          this.room = response.result;
          console.log('Room details loaded:', this.room);
          
          // Thiết lập ảnh đầu tiên làm ảnh mặc định
          if (this.room && this.room.anhPhong && this.room.anhPhong.length > 0) {
            this.selectedImage = this.room.anhPhong[0];
          }
        } else {
          this.errorMessage = 'Không thể tải thông tin phòng.';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading room details:', error);
        this.errorMessage = 'Đã xảy ra lỗi khi tải thông tin phòng.';
        this.isLoading = false;
      }
    });
  }

  // Chuyển đổi danh sách tiện nghi thành mảng
  getTienNghi(): string[] {
    if (!this.room || !this.room.tienNghiDiKem) return [];
    return this.room.tienNghiDiKem.split(',').map(item => item.trim());
  }

  // Kiểm tra xem phòng có tiện nghi cụ thể không
  hasTienNghi(tienNghi: string): boolean {
    const danhSachTienNghi = this.getTienNghi();
    return danhSachTienNghi.some(item => 
      item.toLowerCase().includes(tienNghi.toLowerCase())
    );
  }

  // Định dạng ngày tháng cho API
  formatDateTime(dateStr: string): string {
    if (!dateStr) return '';

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return '';
      }
      
      // Format theo định dạng ISO 8601 với timezone +07:00
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}T00:00:00+07:00`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  // Xử lý đặt phòng
  bookRoom(): void {
    if (this.isCreatingBooking || !this.room) {
      return;
    }

    if (!this.bookingData.checkIn || !this.bookingData.checkOut) {
      alert('Vui lòng chọn ngày check-in và check-out');
      return;
    }

    const checkIn = this.formatDateTime(this.bookingData.checkIn);
    const checkOut = this.formatDateTime(this.bookingData.checkOut);

    if (!checkIn || !checkOut) {
      alert('Ngày không hợp lệ');
      return;
    }

    // Kiểm tra ngày check-out phải sau ngày check-in
    const checkInDate = new Date(this.bookingData.checkIn);
    const checkOutDate = new Date(this.bookingData.checkOut);
    
    if (checkOutDate <= checkInDate) {
      alert('Ngày check-out phải sau ngày check-in');
      return;
    }

    this.isCreatingBooking = true;

    // Sử dụng service để tạo đặt phòng tạm thời
    this.bookingService.createTemporaryBooking(this.room.id, checkIn, checkOut)
      .subscribe({
        next: (response) => {
          console.log('Temporary booking created:', response);
          if (response && (response.status === 200 || response.status === 201) && response.result) {
            // Lưu mã đặt phòng vào localStorage
            this.bookingService.saveBookingId(response.result.maDP);
            
            // Chuyển hướng đến trang dịch vụ sử dụng Router thay vì window.location
            this.router.navigate(['/customer/service'], {
              state: { 
                bookingId: response.result.maDP,
                roomName: response.result.tenPhong,
                checkIn: response.result.ngayDen,
                checkOut: response.result.ngayDi
              }
            });
          } else {
            alert('Phòng không còn trống trong thời gian bạn chọn. Vui lòng chọn thời gian khác.');
          }
          this.isCreatingBooking = false;
        },
        error: (error) => {
          console.error('Error creating temporary booking:', error);
          alert('Phòng không còn trống trong thời gian bạn chọn. Vui lòng chọn thời gian khác.');
          this.isCreatingBooking = false;
        }
      });
  }
}
