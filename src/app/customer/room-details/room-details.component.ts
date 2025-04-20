import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { RoomService } from '../../services/room.service';
import { Room } from '../../models/room.model';
import { BookingService } from '../../services/booking.service';
import { FormsModule } from '@angular/forms';
import flatpickr from 'flatpickr';
import type { Instance as FlatpickrInstance } from 'flatpickr/dist/types/instance';
import 'flatpickr/dist/flatpickr.min.css';

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
  selector: 'app-room-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './room-details.component.html',
  styleUrl: './room-details.component.css'
})
export class RoomDetailsComponent implements OnInit, AfterViewInit {
  @ViewChild('checkInPicker') checkInPicker!: ElementRef;
  @ViewChild('checkOutPicker') checkOutPicker!: ElementRef;
  
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
  
  // Booking dates availability
  bookedDates: {start: Date, end: Date}[] = [];
  isLoadingBookings = false;
  today = new Date();
  minDate = this.formatDateForInput(this.today);
  
  // Flatpickr instances
  checkInFlatpickr: FlatpickrInstance | null = null;
  checkOutFlatpickr: FlatpickrInstance | null = null;

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService,
    private bookingService: BookingService,
    private router: Router,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    // Ensure Flatpickr CSS is loaded
    this.ensureFlatpickrCssLoaded();
    
    // Get the room ID from the route parameters
    this.route.params.subscribe(params => {
      this.roomId = +params['id']; // Convert string to number
      this.loadRoomDetails();
      this.loadRoomBookings();
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

  ngAfterViewInit(): void {
    // We'll try initializing with a bit longer delay to ensure DOM is ready
    setTimeout(() => {
      console.log('Initializing Flatpickr in room-details component');
      // Use direct DOM queries instead of ViewChild since the elements might be conditionally rendered
      this.initFlatpickrWithDirectQuery();
    }, 1000);
  }

  // Initialize Flatpickr using direct DOM queries
  initFlatpickrWithDirectQuery(): void {
    // Find inputs directly in the DOM
    const checkInElement = document.querySelector('input[name="checkIn"]');
    const checkOutElement = document.querySelector('input[name="checkOut"]');
    
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
              this.bookingData.checkIn = this.formatDateForInput(selectedDates[0]);
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
          minDate: this.bookingData.checkIn || 'today',
          disable: this.getDisabledDates(),
          onChange: (selectedDates: Date[]) => {
            if (selectedDates.length > 0) {
              this.bookingData.checkOut = this.formatDateForInput(selectedDates[0]);
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
            this.bookingData.checkIn = this.formatDateForInput(selectedDates[0]);
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
        minDate: this.bookingData.checkIn || 'today',
        disable: this.getDisabledDates(),
        onChange: (selectedDates: Date[]) => {
          if (selectedDates.length > 0) {
            this.bookingData.checkOut = this.formatDateForInput(selectedDates[0]);
          }
        }
      });
      console.log('checkOut flatpickr initialized successfully via ViewChild', this.checkOutFlatpickr);
    } catch (error) {
      console.error('Error initializing checkOut flatpickr via ViewChild:', error);
    }
  }

  // Update checkOut min date when checkIn changes
  updateCheckOutMinDate(date: Date): void {
    if (this.checkOutFlatpickr) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      this.checkOutFlatpickr.set('minDate', nextDay);
      
      // If current checkout date is before new minDate, clear it
      const checkOutDate = this.bookingData.checkOut ? new Date(this.bookingData.checkOut) : null;
      if (checkOutDate && checkOutDate <= date) {
        this.bookingData.checkOut = '';
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
      while (currentDate < endDate) {
        disabledDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    
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

  loadRoomBookings(): void {
    this.isLoadingBookings = true;
    
    this.roomService.getRoomBookings(this.roomId).subscribe({
      next: (response: RoomBookingsResponse) => {
        if (response && response.bookings) {
          // Filter to include only CONFIRMED bookings
          const confirmedBookings = response.bookings.filter(booking => 
            booking.status === 'CONFIRMED');
          
          // Transform the bookings into date ranges
          this.bookedDates = confirmedBookings.map(booking => ({
            start: new Date(booking.checkInTime),
            end: new Date(booking.checkOutTime)
          }));
          
          console.log('Booked dates:', this.bookedDates);
          
          // Update Flatpickr with new disabled dates and reinitialize if needed
          setTimeout(() => {
            if (this.checkInFlatpickr || this.checkOutFlatpickr) {
              console.log('Updating existing Flatpickr instances');
              this.updateFlatpickr();
            } else {
              console.log('Initializing Flatpickr after loading bookings');
              this.initFlatpickrWithDirectQuery();
            }
          }, 500);
        }
        this.isLoadingBookings = false;
      },
      error: (error) => {
        console.error('Error loading room bookings:', error);
        this.isLoadingBookings = false;
      }
    });
  }

  // Format date for input[type=date]
  formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
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

  // Check if a date is booked
  isDateBooked(dateStr: string): boolean {
    if (!dateStr || this.bookedDates.length === 0) return false;
    
    const date = new Date(dateStr);
    
    return this.bookedDates.some(booking => {
      // Check if date falls within a booking period (inclusive of check-in, exclusive of check-out)
      return (date >= booking.start && date < booking.end);
    });
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

    // Check for date conflicts with existing bookings
    const hasConflict = this.bookedDates.some(booking => {
      // Check if check-in date falls within a booking period
      const checkInConflict = checkInDate >= booking.start && checkInDate < booking.end;
      
      // Check if check-out date falls within a booking period
      const checkOutConflict = checkOutDate > booking.start && checkOutDate <= booking.end;
      
      // Check if booking period falls within our selected dates
      const bookingWithinSelection = checkInDate <= booking.start && checkOutDate >= booking.end;
      
      return checkInConflict || checkOutConflict || bookingWithinSelection;
    });

    if (hasConflict) {
      alert('Phòng đã được đặt trong khoảng thời gian bạn chọn. Vui lòng chọn ngày khác.');
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

  // Original initialization method (now being replaced)
  initFlatpickr(): void {
    // Redirect to new method
    this.initFlatpickrWithDirectQuery();
  }
}