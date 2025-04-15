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

  constructor(private roomService: RoomService, private router: Router) {}

  ngOnInit() {
    this.loadRooms();
  }

  loadRooms() {
    this.roomService.getAllRooms().subscribe({
      // Giả sử roomService.getAllRooms() trả về Room[] thay vì ApiResponse
      next: (data: any) => {
        // Kiểm tra cấu trúc dữ liệu trả về và xử lý phù hợp
        if (data && data.status === 200 && data.result) {
          // Trường hợp dữ liệu trả về là ApiResponse
          this.rooms = data.result.content;
          this.currentPage = data.result.currentPage;
          this.totalPages = data.result.totalPages;
          this.totalElements = data.result.totalElements;
        } else if (Array.isArray(data)) {
          // Trường hợp dữ liệu trả về trực tiếp là mảng Room[]
          this.rooms = data;
        } else {
          console.error('API trả về dữ liệu không hợp lệ:', data);
        }
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách phòng:', error);
      }
    });
  }

  editRoom(id: number) {
    this.router.navigate(['/admin/edit-room', id]);
  }

  deleteRoom(id: number) {
    if (confirm('Bạn có chắc chắn muốn xóa phòng này?')) {
      this.roomService.deleteRoom(id).subscribe({
        next: () => {
          this.loadRooms(); // Tải lại danh sách sau khi xóa
        },
        error: (error) => {
          console.error('Lỗi khi xóa phòng:', error);
        }
      });
    }
  }

  updateRoomStatus(room: Room, newStatus: string) {
    const updatedRoom = { ...room, tinhTrang: newStatus };
    this.roomService.updateRoom(room.id, updatedRoom).subscribe({
      next: () => {
        this.loadRooms(); // Tải lại danh sách sau khi cập nhật
      },
      error: (error) => {
        console.error('Lỗi khi cập nhật trạng thái phòng:', error);
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
}