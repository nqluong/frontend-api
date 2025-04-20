import { Component, OnInit, HostListener, ViewChild, ElementRef, AfterViewInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import flatpickr from 'flatpickr';
import type { Instance as FlatpickrInstance } from 'flatpickr/dist/types/instance';
import 'flatpickr/dist/flatpickr.min.css';

// Import models
import { RoomDisplay } from '../../models/booking.model';

// Import services
import { BookingService } from '../../services/booking.service';
import { RoomService } from '../../services/room.service';

interface RoomBooking {
  bookingId: number;
  checkInTime: string;
  checkOutTime: string;
  status: string;
}

interface RoomBookingsResponse {
  roomId: number;
  roomName: string;
  bookings: RoomBooking[];
}

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.css'
})
export class RoomsComponent implements OnInit, AfterViewInit {
  @ViewChild('checkInPicker') checkInPicker!: ElementRef;
  @ViewChild('checkOutPicker') checkOutPicker!: ElementRef;
  
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
  
  // Booking dates availability
  bookedDates: {start: Date, end: Date}[] = [];
  isLoadingBookings: boolean = false;
  today = new Date();
  minDate = this.formatDateForInput(this.today);
  
  // Flatpickr instances
  checkInFlatpickr: FlatpickrInstance | null = null;
  checkOutFlatpickr: FlatpickrInstance | null = null;

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
    @Inject(PLATFORM_ID) platformId: Object,
    private renderer: Renderer2
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
    // Ensure Flatpickr CSS is loaded
    if (this.isBrowser) {
      this.ensureFlatpickrCssLoaded();
    }
    
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
  
  ngAfterViewInit(): void {
    // We'll initialize Flatpickr when the modal is opened
  }
  
  // Methods for booking modal
  openBookingModal(roomId: number): void {
    this.selectedRoomId = roomId;
    this.showBookingModal = true;
    
    // Load room bookings for this room
    this.loadRoomBookings(roomId);
    
    // Focus trap implementation - prevent background scrolling
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
    
    // Initialize Flatpickr after modal is shown with a longer delay
    // to ensure the modal DOM is fully rendered
    setTimeout(() => {
      console.log('Initializing Flatpickr in modal');
      this.initFlatpickrWithDirectQuery();
    }, 500);
  }
  
  closeBookingModal(): void {
    // Destroy Flatpickr instances
    if (this.checkInFlatpickr) {
      this.checkInFlatpickr.destroy();
      this.checkInFlatpickr = null;
    }
    
    if (this.checkOutFlatpickr) {
      this.checkOutFlatpickr.destroy();
      this.checkOutFlatpickr = null;
    }
    
    this.showBookingModal = false;
    this.selectedRoomId = null;
    this.bookedDates = [];
    
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
    
    // Check for date conflicts with existing bookings
    // Kiểm tra xem ngày check-in có bị xung đột không (sử dụng isDateBooked)
    if (this.isDateBooked(this.bookingDates.checkIn)) {
      alert('Ngày check-in đã được đặt. Vui lòng chọn ngày khác.');
      return;
    }
    
    // Kiểm tra xem có ngày nào trong khoảng thời gian đã chọn bị đặt chưa
    let currentDate = new Date(checkInDate);
    let hasConflict = false;
    
    while (currentDate < checkOutDate) {
      if (this.isDateBooked(currentDate.toISOString().split('T')[0])) {
        console.log(`Conflict detected on date: ${currentDate.toISOString().split('T')[0]}`);
        hasConflict = true;
        break;
      }
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (hasConflict) {
      alert('Phòng đã được đặt trong khoảng thời gian bạn chọn. Vui lòng chọn ngày khác.');
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

  // Ensure Flatpickr CSS is loaded
  private ensureFlatpickrCssLoaded(): void {
    // Check if the stylesheet is already loaded
    const existingLink = document.querySelector('link[href*="flatpickr.min.css"]');
    
    if (!existingLink) {
      console.log('Adding Flatpickr CSS to document head');
      const linkElement = this.renderer.createElement('link');
      this.renderer.setAttribute(linkElement, 'rel', 'stylesheet');
      this.renderer.setAttribute(linkElement, 'type', 'text/css');
      this.renderer.setAttribute(linkElement, 'href', 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css');
      this.renderer.appendChild(document.head, linkElement);
    }
  }

  // Initialize Flatpickr using direct DOM queries
  initFlatpickrWithDirectQuery(): void {
    // Find inputs directly in the DOM
    const checkInElement = document.querySelector('#checkInDate');
    const checkOutElement = document.querySelector('#checkOutDate');
    
    console.log('Direct DOM query results:', {
      checkInElement,
      checkOutElement
    });
    
    // Initialize checkIn picker
    if (checkInElement) {
      console.log('Initializing checkIn picker using direct DOM query');
      try {
        this.checkInFlatpickr = flatpickr(checkInElement, {
          dateFormat: 'Y-m-d',
          minDate: 'today',
          disable: this.getDisabledDates(),
          onChange: (selectedDates: Date[]) => {
            if (selectedDates.length > 0) {
              this.bookingDates.checkIn = this.formatDateForInput(selectedDates[0]);
              this.updateCheckOutMinDate(selectedDates[0]);
            }
          }
        });
        console.log('checkIn flatpickr initialized successfully', this.checkInFlatpickr);
      } catch (error) {
        console.error('Error initializing checkIn flatpickr:', error);
      }
    } else {
      console.warn('checkIn element not found with direct DOM query');
      
      // Fallback to ViewChild reference if available
      if (this.checkInPicker?.nativeElement) {
        console.log('Falling back to ViewChild for checkIn');
        this.initCheckInFlatpickr();
      }
    }
    
    // Initialize checkOut picker
    if (checkOutElement) {
      console.log('Initializing checkOut picker using direct DOM query');
      try {
        this.checkOutFlatpickr = flatpickr(checkOutElement, {
          dateFormat: 'Y-m-d',
          minDate: this.bookingDates.checkIn || 'today',
          disable: this.getDisabledDates(),
          onChange: (selectedDates: Date[]) => {
            if (selectedDates.length > 0) {
              this.bookingDates.checkOut = this.formatDateForInput(selectedDates[0]);
            }
          }
        });
        console.log('checkOut flatpickr initialized successfully', this.checkOutFlatpickr);
      } catch (error) {
        console.error('Error initializing checkOut flatpickr:', error);
      }
    } else {
      console.warn('checkOut element not found with direct DOM query');
      
      // Fallback to ViewChild reference if available
      if (this.checkOutPicker?.nativeElement) {
        console.log('Falling back to ViewChild for checkOut');
        this.initCheckOutFlatpickr();
      }
    }
  }

  // Initialize checkIn Flatpickr using ViewChild
  initCheckInFlatpickr(): void {
    try {
      this.checkInFlatpickr = flatpickr(this.checkInPicker.nativeElement, {
        dateFormat: 'Y-m-d',
        minDate: 'today',
        disable: this.getDisabledDates(),
        onChange: (selectedDates: Date[]) => {
          if (selectedDates.length > 0) {
            this.bookingDates.checkIn = this.formatDateForInput(selectedDates[0]);
            this.updateCheckOutMinDate(selectedDates[0]);
          }
        }
      });
      console.log('checkIn flatpickr initialized successfully via ViewChild', this.checkInFlatpickr);
    } catch (error) {
      console.error('Error initializing checkIn flatpickr via ViewChild:', error);
    }
  }

  // Initialize checkOut Flatpickr using ViewChild
  initCheckOutFlatpickr(): void {
    try {
      this.checkOutFlatpickr = flatpickr(this.checkOutPicker.nativeElement, {
        dateFormat: 'Y-m-d',
        minDate: this.bookingDates.checkIn || 'today',
        disable: this.getDisabledDates(),
        onChange: (selectedDates: Date[]) => {
          if (selectedDates.length > 0) {
            this.bookingDates.checkOut = this.formatDateForInput(selectedDates[0]);
          }
        }
      });
      console.log('checkOut flatpickr initialized successfully via ViewChild', this.checkOutFlatpickr);
    } catch (error) {
      console.error('Error initializing checkOut flatpickr via ViewChild:', error);
    }
  }

  // Original initialization method (now being replaced)
  initFlatpickr(): void {
    // Redirect to new method
    this.initFlatpickrWithDirectQuery();
  }

  // Update checkOut min date when checkIn changes
  updateCheckOutMinDate(date: Date): void {
    if (this.checkOutFlatpickr) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      this.checkOutFlatpickr.set('minDate', nextDay);
      
      // If current checkout date is before new minDate, clear it
      const checkOutDate = this.bookingDates.checkOut ? new Date(this.bookingDates.checkOut) : null;
      if (checkOutDate && checkOutDate <= date) {
        this.bookingDates.checkOut = '';
      }
    }
  }

  // Get disabled dates array for Flatpickr
  getDisabledDates(): Date[] {
    const disabledDates: Date[] = [];
    
    // For each booking, add all dates in the range to the disabled array
    this.bookedDates.forEach(booking => {
      const currentDate = new Date(booking.start);
      const endDate = new Date(booking.end);
      
      // Add each date in the booking period to disabled dates
      // Chỉ disable các ngày từ ngày check-in đến trước ngày check-out
      // (không bao gồm ngày check-out để có thể đặt phòng ngay sau khi booking cũ kết thúc)
      while (currentDate < endDate) {
        disabledDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      console.log(`Disabled range: ${booking.start.toISOString().split('T')[0]} to ${new Date(endDate.getTime() - 86400000).toISOString().split('T')[0]}`);
    });
    
    console.log(`Total disabled dates: ${disabledDates.length}`);
    return disabledDates;
  }

  // Update flatpickr when new booking data is loaded
  updateFlatpickr(): void {
    if (this.checkInFlatpickr) {
      this.checkInFlatpickr.set('disable', this.getDisabledDates());
    }
    
    if (this.checkOutFlatpickr) {
      this.checkOutFlatpickr.set('disable', this.getDisabledDates());
    }
  }

  // Format date for input type="date"
  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Load room bookings to check availability
  loadRoomBookings(roomId: number): void {
    this.isLoadingBookings = true;
    this.bookedDates = [];
    
    this.roomService.getRoomBookings(roomId).subscribe({
      next: (response: RoomBookingsResponse) => {
        if (response && response.bookings) {
          // Filter to include only CONFIRMED bookings
          const confirmedBookings = response.bookings.filter(booking => 
            booking.status === 'CONFIRMED');
          
          // Transform the bookings into date ranges
          this.bookedDates = confirmedBookings.map(booking => {
            const start = new Date(booking.checkInTime);
            let end = new Date(booking.checkOutTime);
            
            // Xử lý trường hợp đặc biệt: checkIn và checkOut cùng ngày
            // Trong trường hợp này, sử dụng toàn bộ ngày đó cho booking
            if (end.getTime() === start.getTime()) {
              console.log(`Booking ${booking.bookingId} has same day check-in/check-out: ${start.toISOString().split('T')[0]}`);
              // Đặt thời gian kết thúc là cuối ngày
              end.setHours(23, 59, 59, 999);
            } else {
              // Đối với booking bình thường, kéo dài booking đến hết ngày checkout
              // để đảm bảo không ai có thể đặt phòng vào ngày checkout
              end.setHours(23, 59, 59, 999);
            }
            
            console.log(`Parsed booking: ${booking.bookingId}, Start: ${start.toISOString()}, End: ${end.toISOString()}`);
            
            return {
              start: start,
              end: end
            };
          });
          
          console.log('Booked dates:', this.bookedDates);
          
          // Update or Initialize Flatpickr with the new booking data
          setTimeout(() => {
            if (this.checkInFlatpickr || this.checkOutFlatpickr) {
              console.log('Updating existing Flatpickr instances');
              this.updateFlatpickr();
            } else {
              console.log('Initializing Flatpickr after loading bookings');
              this.initFlatpickrWithDirectQuery();
            }
          }, 300);
        }
        this.isLoadingBookings = false;
      },
      error: (error) => {
        console.error('Error loading room bookings:', error);
        this.isLoadingBookings = false;
      }
    });
  }

  // Check if a date is booked
  isDateBooked(dateStr: string): boolean {
    if (!dateStr || this.bookedDates.length === 0) return false;
    
    const date = new Date(dateStr);
    
    return this.bookedDates.some(booking => {
      // Check if date falls within a booking period
      // Trong khoảng từ ngày check-in đến hết ngày check-out
      return (date >= booking.start && date <= booking.end);
    });
  }

  // Handle date selection for check-in
  onCheckInDateChange() {
    if (this.bookingDates.checkIn) {
      const checkInDate = new Date(this.bookingDates.checkIn);
      
      // Find the next booked date after check-in
      let nextBookedDate: Date | null = null;
      
      for (const booking of this.bookedDates) {
        if (booking.start > checkInDate) {
          if (!nextBookedDate || booking.start < nextBookedDate) {
            nextBookedDate = booking.start;
          }
        }
      }
      
      // Set default check-out to the day before next booking, or check-in + 1 day
      const nextDay = new Date(checkInDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      if (nextBookedDate && nextBookedDate <= nextDay) {
        // Don't set check-out if next day is booked
        this.bookingDates.checkOut = '';
      } else {
        this.bookingDates.checkOut = this.formatDateForInput(nextDay);
      }
    }
  }
}