import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

// Import models
import { RoomDisplay } from '../../models/booking.model';

// Import services
import { BookingService } from '../../services/booking.service';
import { RoomService } from '../../services/room.service';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.css'
})
export class RoomsComponent implements OnInit {
  searchResults: RoomDisplay[] = [];
  checkInDate: string = '';
  checkOutDate: string = '';
  isCreatingBooking: boolean = false;
  isBrowser: boolean;
  isSearchResult: boolean = false;
  currentPage: number = 0;
  totalPages: number = 0;
  
  // Properties for booking modal
  showBookingModal: boolean = false;
  selectedRoomId: number | null = null;
  bookingDates = {
    checkIn: '',
    checkOut: ''
  };

  // Handle keyboard events for modal accessibility
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Close modal on Escape key
    if (this.showBookingModal && event.key === 'Escape') {
      this.closeBookingModal();
    }
  }

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private bookingService: BookingService,
    private roomService: RoomService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Lấy dữ liệu từ navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.searchResults = navigation.extras.state['searchResults'];
      this.checkInDate = navigation.extras.state['checkIn'];
      this.checkOutDate = navigation.extras.state['checkOut'];
      this.isSearchResult = true;
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
      this.isSearchResult = true;
      console.log('History state data:', this.searchResults);
    }
    
    // Nếu không có kết quả tìm kiếm, tải danh sách phòng từ API
    if (this.searchResults.length === 0) {
      this.loadAllRooms();
    }
    
    // If we already have check-in and check-out dates from search, initialize the booking dates
    if (this.checkInDate && this.checkOutDate) {
      // Format dates for input[type=date] (YYYY-MM-DD)
      const checkInDate = new Date(this.checkInDate);
      const checkOutDate = new Date(this.checkOutDate);
      
      if (!isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime())) {
        this.bookingDates.checkIn = checkInDate.toISOString().split('T')[0];
        this.bookingDates.checkOut = checkOutDate.toISOString().split('T')[0];
      }
    } else {
      // Set default dates (today and tomorrow)
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      this.bookingDates.checkIn = today.toISOString().split('T')[0];
      this.bookingDates.checkOut = tomorrow.toISOString().split('T')[0];
    }
  }
  
  // Methods for booking modal
  openBookingModal(roomId: number): void {
    this.selectedRoomId = roomId;
    this.showBookingModal = true;
    
    // Focus trap implementation - prevent background scrolling
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
      
      // Focus the first input after modal is shown
      setTimeout(() => {
        const firstInput = document.getElementById('checkInDate');
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    }
  }
  
  closeBookingModal(): void {
    this.showBookingModal = false;
    this.selectedRoomId = null;
    
    // Re-enable scrolling
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }
  
  confirmBooking(): void {
    console.log('Confirming booking with room ID:', this.selectedRoomId);
    
    if (!this.selectedRoomId || !this.bookingDates.checkIn || !this.bookingDates.checkOut) {
      alert('Vui lòng chọn ngày check-in và check-out');
      return;
    }
    
    // Validate dates
    const checkInDate = new Date(this.bookingDates.checkIn);
    const checkOutDate = new Date(this.bookingDates.checkOut);
    
    if (checkOutDate <= checkInDate) {
      alert('Ngày check-out phải sau ngày check-in');
      return;
    }
    
    // Format dates for API
    const checkInFormatted = this.fixDateFormat(this.bookingDates.checkIn);
    const checkOutFormatted = this.fixDateFormat(this.bookingDates.checkOut);
    
    // Store the room ID before closing the modal
    const roomId = this.selectedRoomId;
    
    // Close modal and proceed with booking
    this.closeBookingModal();
    
    // Use the stored roomId
    this.bookRoom(roomId, checkInFormatted, checkOutFormatted);
  }
  
  // Hàm tải tất cả phòng
  loadAllRooms(page?: number): void {
    if (page !== undefined) {
      this.currentPage = page;
    }
    
    this.roomService.getAllRooms(this.currentPage).subscribe({
      next: (response) => {
        if (response && response.status === 200 && response.result) {
          // Chuyển đổi dữ liệu từ API sang định dạng hiển thị
          this.searchResults = response.result.content.map((room: any) => this.transformRoomData(room));
          this.currentPage = response.result.currentPage - 1; // API trả về page bắt đầu từ 1
          this.totalPages = response.result.totalPages;
          console.log('All rooms loaded:', this.searchResults);
        }
      },
      error: (error) => {
        console.error('Error loading rooms:', error);
      }
    });
  }
  
  // Chuyển đổi dữ liệu
  private transformRoomData(room: any): RoomDisplay {
    return {
      id: room.id,
      tenPhong: `${room.loaiPhong} ${room.tenPhong}`,
      gia: room.gia,
      loaiPhong: room.loaiPhong,
      tienNghi: room.tienNghiDiKem ? room.tienNghiDiKem.split(',').map((item: string) => item.trim()) : [],
      anhPhong: room.anhPhong || []
    };
  }

  // Kiểm tra và sửa định dạng ngày tháng nếu cần
  fixDateFormat(dateString: string): string {
    if (!dateString) return '';
    
    console.log('Fixing date format for:', dateString);
    
    try {
      // Chuyển string thành đối tượng Date
      const date = new Date(dateString);
      
      // Kiểm tra xem date có hợp lệ không
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return dateString;
      }
      
      // Lấy các thành phần ngày tháng
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // getMonth() trả về 0-11
      const day = date.getDate();
      
      // Nếu năm < 2000 hoặc > 2100, có thể là lỗi
      if (year < 2000 || year > 2100) {
        console.warn('Năm bất thường:', year);
        
        // Lấy ngày hiện tại
        const today = new Date();
        
        // Nếu có thể tách thành ngày, tháng, năm từ chuỗi gốc
        const parts = dateString.split(/[-T]/); // Tách theo - hoặc T
        if (parts.length >= 3) {
          let day = parseInt(parts[2]);
          let month = parseInt(parts[1]);
          
          // Kiểm tra tính hợp lệ của ngày và tháng
          if (isNaN(day) || day < 1 || day > 31) day = today.getDate();
          if (isNaN(month) || month < 1 || month > 12) month = today.getMonth() + 1;
          
          // Tạo ngày mới với năm hiện tại
          const currentYear = today.getFullYear();
          const fixedDate = new Date(currentYear, month - 1, day);
          
          // Format ISO với timezone
          return fixedDate.toISOString().split('T')[0] + 'T00:00:00+07:00';
        }
      }
      
      // Nếu không có vấn đề, format lại theo ISO 8601 với +07:00
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00+07:00`;
    } catch (error) {
      console.error('Error parsing date:', error);
      return dateString;
    }
  }

  bookRoom(roomId: number, checkIn?: string, checkOut?: string) {
    if (this.isCreatingBooking) {
      return; // Tránh gửi nhiều request cùng lúc
    }

    // Use passed parameters if provided, otherwise use existing dates
    const checkInToUse = checkIn || this.checkInDate;
    const checkOutToUse = checkOut || this.checkOutDate;

    // If we don't have dates and didn't get them as parameters, we should have shown the modal
    if (!checkInToUse || !checkOutToUse) {
      console.error('Missing check-in or check-out dates');
      return;
    }
    
    if (!roomId) {
      console.error('Missing room ID');
      alert('Lỗi: Không tìm thấy thông tin phòng. Vui lòng thử lại.');
      return;
    }

    this.isCreatingBooking = true;

    // Sửa lại định dạng ngày nếu cần
    const checkInFixed = this.fixDateFormat(checkInToUse);
    const checkOutFixed = this.fixDateFormat(checkOutToUse);

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
