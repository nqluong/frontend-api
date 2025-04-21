import { Component, OnInit, AfterViewInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RoomService } from '../../services/room.service';
import { HotelsService } from '../../services/hotels.service';
import { Hotel } from '../../models/hotels.model';

// Interface cho dữ liệu từ API
interface RoomResponse {
  id: number;
  tenPhong: string;
  loaiPhong: string;
  gia: number;
  tinhTrang: string;
  tienNghiDiKem: string;
  moTa: string;
  anhPhong: string[];
  khachSan: {
    maKS: number;
    name: string;
    diaChi: string;
    moTa: string;
    sdt: string;
  };
}

// Interface cho dữ liệu hiển thị
interface RoomDisplay {
  id: number;
  tenPhong: string;
  gia: number;
  loaiPhong: string;
  soNguoi: string;
  tienNghi: string[];
  imageUrl: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, AfterViewInit {
  searchParams = {
    checkIn: '',
    checkOut: '',
    roomType: ''
  };

  searchResults: RoomDisplay[] = [];
  roomTypes: any[] = [];
  hotel: Hotel | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private roomService: RoomService,
    private hotelsService: HotelsService
  ) {}

  // Xử lý sự kiện khi ngày thay đổi
  onDateChange(field: 'checkIn' | 'checkOut', event: any): void {
    console.log(`Date change for ${field}:`, event.target.value);
    
    // Đảm bảo định dạng ngày đúng
    if (event.target.value) {
      // Giữ nguyên giá trị từ input type="date" (format yyyy-mm-dd)
      this.searchParams[field] = event.target.value;
    }
  }

  // Hàm chuyển đổi loại phòng sang số người
  private mapRoomTypeToCapacity(loaiPhong: string): string {
    switch (loaiPhong) {
      case 'Phòng Đơn':
        return '1 Person';
      case 'Phòng Đôi':
        return '2 Persons';
      case 'Phòng VIP':
        return '3 Persons';
      default:
        return '2 Persons';
    }
  }

  // Hàm lấy đường dẫn ảnh từ dữ liệu API
  public getRoomImageUrl(room: any): string {
    // Kiểm tra xem có anhPhong trong dữ liệu API không
    if (room.anhPhong && room.anhPhong.length > 0) {
      return `assets/images/AnhPhong/${room.anhPhong[0]}`;
    }
    
    // Nếu không có, sử dụng ảnh mặc định dựa trên loại phòng
    let imgPrefix = '';
    if (room.loaiPhong.includes('Đơn')) {
      imgPrefix = 'Don1';
    } else if (room.loaiPhong.includes('Đôi')) {
      imgPrefix = 'Doi1';
    } else if (room.loaiPhong.includes('Vip') || room.loaiPhong.includes('VIP')) {
      imgPrefix = 'Vip1';
    }
    
    return `assets/images/AnhPhong/${imgPrefix}.jpg`;
  }

  // Hàm chuyển đổi dữ liệu từ API sang format hiển thị
  private transformRoomData(room: RoomResponse): RoomDisplay {
    let imageUrl = '';
    if (room.anhPhong && room.anhPhong.length > 0) {
      imageUrl = `assets/images/AnhPhong/${room.anhPhong[0]}`;
    } else {
      imageUrl = this.getDefaultImageByRoomType(room.loaiPhong);
    }
    
    return {
      id: room.id,
      tenPhong: `${room.loaiPhong} ${room.tenPhong}`,
      gia: room.gia,
      loaiPhong: room.loaiPhong === 'Phòng Đơn' ? 'Single Bed' : 
                 room.loaiPhong === 'Phòng Đôi' ? 'King Size Bed' : 'VIP Bed',
      soNguoi: this.mapRoomTypeToCapacity(room.loaiPhong),
      tienNghi: room.tienNghiDiKem.split(',').map(item => item.trim()),
      imageUrl: imageUrl
    };
  }
  
  // Lấy ảnh mặc định dựa trên loại phòng
  private getDefaultImageByRoomType(roomType: string): string {
    if (roomType.includes('Đơn')) {
      return 'assets/images/AnhPhong/Don1.jpg';
    } else if (roomType.includes('Đôi')) {
      return 'assets/images/AnhPhong/Doi1.jpg';
    } else { // Vip or default
      return 'assets/images/AnhPhong/Vip1.jpg';
    }
  }

  // Hàm format ngày giờ theo yêu cầu của backend
  private formatDateTime(dateStr: string): string {
    if (!dateStr) {
      console.error('Ngày không được để trống');
      return '';
    }

    try {
      let date: Date;
      
      // Kiểm tra các định dạng phổ biến
      if (dateStr.includes('/')) {
        // Định dạng dd/mm/yyyy 
        const [day, month, year] = dateStr.split('/').map(num => parseInt(num, 10));
        date = new Date(year, month - 1, day, 7, 0, 0);
      } 
      else if (dateStr.includes('-')) {
        // Có thể là yyyy-mm-dd hoặc dd-mm-yyyy
        const parts = dateStr.split('-').map(num => parseInt(num, 10));
        
        // Kiểm tra nếu phần đầu tiên là năm (4 chữ số và > 1000)
        if (parts[0] > 1000 && String(parts[0]).length === 4) {
          // Định dạng yyyy-mm-dd
          const [year, month, day] = parts;
          date = new Date(year, month - 1, day, 7, 0, 0);
        } else {
          // Định dạng dd-mm-yyyy
          const [day, month, year] = parts;
          date = new Date(year, month - 1, day, 7, 0, 0);
        }
      } 
      else {
        // Thử phân tích dưới dạng timestamp hoặc chuỗi ngày hợp lệ khác
        date = new Date(dateStr);
      }
      
      // Kiểm tra tính hợp lệ của ngày
      if (isNaN(date.getTime())) {
        throw new Error('Ngày không hợp lệ');
      }
      
      // Xác minh năm hợp lệ (tránh vấn đề về năm lạ)
      const currentYear = new Date().getFullYear();
      const year = date.getFullYear();
      
      if (year < currentYear || year > currentYear + 10) {
        date.setFullYear(currentYear);
      }
      
      // Format theo định dạng ISO 8601 với timezone
      return date.toISOString().replace('Z', '+07:00');
    } catch (error) {
      console.error('Error formatting date:', error, 'for input:', dateStr);
      return '';
    }
  }

  ngOnInit(): void {
    this.loadRooms();
    this.loadHotel();
    // Reset date inputs
    this.resetDateInputs();
  }

  ngAfterViewInit(): void {
    // Reinitialize custom datepicker if it exists
    this.initializeCustomDatepicker();
  }

  private resetDateInputs(): void {
    // Reset search params when entering the page
    this.searchParams = {
      checkIn: '',
      checkOut: '',
      roomType: ''
    };
  }

  private initializeCustomDatepicker(): void {
    if (typeof window !== 'undefined') {
      // Đợi DOM load xong và styles được áp dụng
      setTimeout(() => {
        const win = window as any;
        
        // Nếu có hàm khởi tạo datepicker từ thư viện bên thứ ba
        if (win.initDatepicker) {
          win.initDatepicker();
        }
        
        // Áp dụng khởi tạo tùy chỉnh của chúng ta
        const dateElements = document.querySelectorAll('.custom-datepicker');
        dateElements.forEach(el => {
          // Thêm class để đánh dấu element đã được khởi tạo
          el.classList.add('date-pick-initialized');
          
          // Log để xác nhận việc khởi tạo
          console.log('Date picker initialized:', el);
          
          // Xử lý sự kiện click cho datepicker tùy chỉnh
          const inputElement = el as HTMLInputElement;
          const parent = inputElement.parentElement;
          const iconElement = parent?.querySelector('i.fas.fa-calendar');
          
          // Hàm tạo hiệu ứng ripple
          const createRipple = (event: MouseEvent) => {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            parent?.appendChild(ripple);
            
            setTimeout(() => {
              ripple.remove();
            }, 600); // Thời gian của animation
          };
          
          // Xử lý sự kiện focus
          inputElement.onfocus = () => {
            if (iconElement) {
              iconElement.classList.add('active');
              parent?.classList.add('focused');
            }
          };
          
          // Xử lý sự kiện blur
          inputElement.onblur = () => {
            if (iconElement) {
              iconElement.classList.remove('active');
              parent?.classList.remove('focused');
            }
          };
          
          // Xử lý sự kiện click
          inputElement.onclick = (event) => {
            createRipple(event as MouseEvent);
          };
          
          // Xử lý click vào icon để mở datepicker
          if (iconElement) {
            (iconElement as HTMLElement).onclick = (event) => {
              createRipple(event as MouseEvent);
              inputElement.showPicker();
              inputElement.focus();
            };
          }
        });
      }, 300);
    }
  }

  // Hàm lấy danh sách phòng từ backend
  loadRooms(): void {
    this.roomService.getRoomTypes().subscribe({
      next: (data) => {
        this.roomTypes = data;
      },
      error: (error) => {
        console.error('Error fetching room data:', error);
        alert('Không thể tải danh sách phòng. Vui lòng thử lại sau.');
      }
    });
  }

  getFacilityIcon(facility: string): string {
    const iconMap: { [key: string]: string } = {
      'Wifi': 'fa fa-wifi',
      'TV': 'fa fa-tv',
      'Bồn tắm': 'fa fa-bath'
      // thêm các tiện ích khác nếu có
    };
  
    const key = facility.toLowerCase();
    return iconMap[key] || 'fal fa-check-circle'; // mặc định nếu không khớp
  }
  
  // Hàm chia mô tả khách sạn thành danh sách các điểm
  getDescriptionPoints(): string[] {
    if (!this.hotel || !this.hotel.moTa) {
      return [];
    }
    
    // Chia mô tả thành các câu dựa trên dấu chấm
    let sentences = this.hotel.moTa.split('.');
    
    // Lọc ra các câu không rỗng và cắt bỏ khoảng trắng dư
    return sentences
      .map((sentence: string) => sentence.trim())
      .filter((sentence: string) => sentence.length > 0);
  }

  loadHotel(): void {
    this.hotelsService.getHotels().subscribe({
      next: (data) => {
        if (data && data.result && data.result.length > 0) {
          this.hotel = data.result[0]; // Lấy khách sạn đầu tiên từ API
        }
      },
      error: (error) => {
        console.error('Error fetching hotel data:', error);
      }
    });
  }

  searchRooms(): void {
    // Kiểm tra dữ liệu đầu vào
    console.log('Raw check-in date:', this.searchParams.checkIn, 'type:', typeof this.searchParams.checkIn);
    console.log('Raw check-out date:', this.searchParams.checkOut, 'type:', typeof this.searchParams.checkOut);
    
    if (!this.searchParams.checkIn || !this.searchParams.checkOut) {
      alert('Vui lòng chọn ngày check-in và check-out');
      return;
    }

    // Chuyển đổi chuỗi ngày thành đối tượng Date
    try {
      // Phân tích ngày theo định dạng dd-mm-yyyy
      let checkInParts, checkOutParts;
      
      if (this.searchParams.checkIn.includes('-')) {
        checkInParts = this.searchParams.checkIn.split('-');
        // Kiểm tra nếu đang ở định dạng dd-mm-yyyy
        if (checkInParts.length === 3 && parseInt(checkInParts[0]) <= 31) {
          const [day, month, year] = checkInParts.map(p => parseInt(p, 10));
          this.searchParams.checkIn = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
      }
      
      if (this.searchParams.checkOut.includes('-')) {
        checkOutParts = this.searchParams.checkOut.split('-');
        // Kiểm tra nếu đang ở định dạng dd-mm-yyyy
        if (checkOutParts.length === 3 && parseInt(checkOutParts[0]) <= 31) {
          const [day, month, year] = checkOutParts.map(p => parseInt(p, 10));
          this.searchParams.checkOut = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
      }
      
      console.log('Reformatted check-in:', this.searchParams.checkIn);
      console.log('Reformatted check-out:', this.searchParams.checkOut);
      
      // Nếu đã chuyển đổi đúng, tiếp tục
      const checkInDate = new Date(this.searchParams.checkIn);
      const checkOutDate = new Date(this.searchParams.checkOut);
      
      console.log('Parsed check-in date:', checkInDate);
      console.log('Parsed check-out date:', checkOutDate);
      
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        throw new Error('Invalid date format');
      }
      
      if (checkOutDate <= checkInDate) {
        alert('Ngày check-out phải sau ngày check-in');
        return;
      }
    } catch (error) {
      console.error('Date parsing error:', error);
      alert('Lỗi định dạng ngày. Vui lòng nhập ngày theo định dạng yyyy-mm-dd.');
      return;
    }

    const checkIn = this.formatDateTime(this.searchParams.checkIn);
    const checkOut = this.formatDateTime(this.searchParams.checkOut);

    console.log('Formatted check-in date:', checkIn);
    console.log('Formatted check-out date:', checkOut);

    // Kiểm tra xem ngày đã được format hợp lệ chưa
    if (!checkIn || !checkOut) {
      alert('Ngày không hợp lệ');
      return;
    }

    console.log('Sending request with params:', {
      checkIn,
      checkOut,
      roomType: this.searchParams.roomType
    });

    let params = new HttpParams()
      .set('checkIn', checkIn)
      .set('checkOut', checkOut);
    
    if (this.searchParams.roomType) {
      params = params.set('roomType', this.searchParams.roomType);
    }

    this.http.get<RoomResponse[]>('http://localhost:8080/hotelbooking/rooms/search', { params })
      .subscribe({
        next: (results) => {
          console.log('API Response:', results);
          if (results && results.length > 0) {
            const transformedResults = results.map(room => this.transformRoomData(room));
            console.log('Transformed Results:', transformedResults);
            
            // Lưu kết quả vào state và điều hướng, thêm thông tin check-in và check-out
            this.router.navigate(['/customer/rooms'], {
              state: { 
                searchResults: transformedResults,
                checkIn: checkIn, // Truyền ngày check-in
                checkOut: checkOut // Truyền ngày check-out
              }
            }).then(() => {
              console.log('Navigation completed');
            }).catch(error => {
              console.error('Navigation error:', error);
            });
          } else {
            alert('Không tìm thấy phòng phù hợp với tiêu chí tìm kiếm');
          }
        },
        error: (error) => {
          console.error('API Error:', error);
          alert('Có lỗi xảy ra khi tìm kiếm phòng. Vui lòng thử lại sau.');
        }
      });
  }
}
