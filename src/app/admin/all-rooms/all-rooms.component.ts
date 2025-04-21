import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RoomService } from '../../services/room.service';
import { ApiService } from '../../services/api.service';
import { HttpClientModule } from '@angular/common/http';

interface Room {
  id: number;
  tenPhong: string;
  loaiPhong: string;
  gia: number;
  tinhTrang: string;
  tienNghiDiKem: string;
  moTa: string;
  anhPhong: string[];
}

interface ApiResponse {
  status: number;
  time: string;
  result: {
    content: Room[];
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
  };
}

@Component({
  selector: 'app-all-rooms',
  standalone: true,
  imports: [RouterModule, CommonModule, HttpClientModule],
  providers: [RoomService, ApiService],
  templateUrl: './all-rooms.component.html',
  styleUrl: './all-rooms.component.css'
})
export class AllRoomsComponent implements OnInit {
  rooms: Room[] = [];
  selectedRoom?: Room;
  currentPage = 1;
  totalPages = 1;
  totalElements = 0;
  loading = false;
  error = '';

  constructor(private roomService: RoomService, private router: Router) {}

  ngOnInit() {
    this.loadRooms();
  }

  loadRooms() {
    this.loading = true;
    this.error = '';
    
    this.roomService.getAllRooms().subscribe({
      next: (data: any) => {
        this.loading = false;
        
        // Kiểm tra cấu trúc dữ liệu trả về và xử lý phù hợp
        if (data && data.status === 200 && data.result) {
          // Trường hợp dữ liệu trả về là ApiResponse
          if (data.result.content) {
            this.rooms = data.result.content;
            this.currentPage = data.result.currentPage;
            this.totalPages = data.result.totalPages;
            this.totalElements = data.result.totalElements;
          } else if (Array.isArray(data.result)) {
            this.rooms = data.result;
          }
        } else if (Array.isArray(data)) {
          // Trường hợp dữ liệu trả về trực tiếp là mảng Room[]
          this.rooms = data;
        } else {
          console.error('API trả về dữ liệu không hợp lệ:', data);
          this.error = 'Không thể tải dữ liệu phòng. Vui lòng thử lại sau.';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Lỗi khi tải danh sách phòng:', error);
        this.error = 'Đã xảy ra lỗi khi tải danh sách phòng.';
      }
    });
  }

  editRoom(id: number) {
    this.router.navigate(['/admin/edit-room', id]);
  }

  deleteRoom(id: number) {
    if (confirm('Bạn có chắc chắn muốn xóa phòng này?')) {
      this.loading = true;
      
      // Đầu tiên xóa ảnh của phòng
      this.roomService.deleteRoomImages(id).subscribe({
        next: () => {
          console.log('Đã xóa ảnh phòng thành công');
          
          // Sau khi xóa ảnh thành công, tiếp tục xóa phòng
          this.roomService.deleteRoom(id).subscribe({
            next: () => {
              this.loading = false;
              alert('Đã xóa phòng thành công!');
              this.loadRooms(); // Tải lại danh sách sau khi xóa
            },
            error: (error) => {
              this.loading = false;
              console.error('Lỗi khi xóa phòng:', error);
              
              // Kiểm tra mã lỗi hoặc thông điệp để xác định nếu phòng đang được sử dụng
              if (error.status === 400 || error.status === 409) {
                // Kiểm tra thông điệp lỗi cụ thể
                if (error.error && error.error.message && 
                    (error.error.message.includes('Uncategorized error') || 
                     error.error.message.includes('liên kết') ||
                     error.error.message.includes('đang có đặt phòng'))) {
                  alert('Phòng này đang được sử dụng hoặc có đặt phòng, không thể xóa!');
                } else {
                  // Nếu API trả về thông điệp lỗi, hiển thị nó
                  alert(error.error.message || 'Xóa phòng không thành công. Phòng có thể đang được sử dụng.');
                }
              } else {
                alert('Xóa phòng không thành công. Vui lòng thử lại sau.');
              }
            }
          });
        },
        error: (error) => {
          this.loading = false;
          console.error('Lỗi khi xóa ảnh phòng:', error);
          alert('Lỗi khi xóa ảnh phòng. Vui lòng thử lại sau.');
        }
      });
    }
  }

  updateRoomStatus(room: Room, newStatus: string) {
    this.loading = true;
    
    // Tạo bản sao đối tượng phòng với trạng thái mới
    const updatedRoom = { ...room, tinhTrang: newStatus };
    
    this.roomService.updateRoom(room.id, updatedRoom).subscribe({
      next: () => {
        this.loading = false;
        this.loadRooms(); // Tải lại danh sách sau khi cập nhật
      },
      error: (error) => {
        this.loading = false;
        console.error('Lỗi khi cập nhật trạng thái phòng:', error);
        alert('Cập nhật trạng thái không thành công. Vui lòng thử lại sau.');
      }
    });
  }
  
  // Các phương thức hỗ trợ hiển thị trạng thái
  getStatusClass(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'bg-success-light';
      case 'BOOKED': return 'bg-warning-light';
      case 'OCCUPIED': return 'bg-danger-light';
      case 'CLEANING': return 'bg-info-light';
      case 'MAINTENANCE': return 'bg-secondary-light';
      default: return 'bg-light';
    }
  }
  
  getStatusText(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'Trống';
      case 'BOOKED': return 'Đã đặt';
      case 'OCCUPIED': return 'Đang ở';
      case 'CLEANING': return 'Đang dọn';
      case 'MAINTENANCE': return 'Bảo trì';
      default: return status;
    }
  }
  
  // Phương thức để hiển thị preview ảnh phòng
  getFirstImageUrl(room: Room): string {
    if (room.anhPhong && room.anhPhong.length > 0) {
      return room.anhPhong[0];
    }
    return 'assets/images/no-image.png'; // Ảnh mặc định
  }
}