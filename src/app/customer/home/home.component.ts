import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit{
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

  // Hàm chuyển đổi dữ liệu từ API sang format hiển thị
  private transformRoomData(room: RoomResponse): RoomDisplay {
    return {
      id: room.id,
      tenPhong: `${room.loaiPhong} ${room.tenPhong}`,
      gia: room.gia,
      loaiPhong: room.loaiPhong === 'Phòng Đơn' ? 'Single Bed' : 
                 room.loaiPhong === 'Phòng Đôi' ? 'King Size Bed' : 'VIP Bed',
      soNguoi: this.mapRoomTypeToCapacity(room.loaiPhong),
      tienNghi: room.tienNghiDiKem.split(',').map(item => item.trim())
    };
  }

  // Hàm format ngày giờ theo yêu cầu của backend
  private formatDateTime(dateStr: string): string {
    if (!dateStr) {
      console.error('Ngày không được để trống');
      return '';
    }

    try {
      // Chuyển đổi chuỗi ngày thành đối tượng Date
      const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
      
      // Xác minh năm hợp lệ (tránh vấn đề về năm lạ như 1915, 1917)
      const currentYear = new Date().getFullYear();
      const validYear = (year >= currentYear && year <= currentYear + 10) ? year : currentYear;
      
      // Tạo đối tượng Date với năm đã xác minh
      const date = new Date(validYear, month - 1, day, 7, 0, 0); // Set giờ là 7:00:00

      // Kiểm tra tính hợp lệ của ngày
      if (isNaN(date.getTime())) {
        throw new Error('Ngày không hợp lệ');
      }

      // Format theo định dạng ISO 8601 với timezone
      return date.toISOString().replace('Z', '+07:00');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  ngOnInit(): void {
    this.loadRooms();
    this.loadHotel();
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
    if (!this.searchParams.checkIn || !this.searchParams.checkOut) {
      alert('Vui lòng chọn ngày check-in và check-out');
      return;
    }

    // Kiểm tra ngày check-out phải sau ngày check-in
    const checkInDate = new Date(this.searchParams.checkIn);
    const checkOutDate = new Date(this.searchParams.checkOut);
    
    if (checkOutDate <= checkInDate) {
      alert('Ngày check-out phải sau ngày check-in');
      return;
    }

    const checkIn = this.formatDateTime(this.searchParams.checkIn);
    const checkOut = this.formatDateTime(this.searchParams.checkOut);

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
