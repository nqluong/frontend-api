import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoomService } from '../../services/room.service';
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
    content: Room;
  };
}

@Component({
  selector: 'app-edit-room',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './edit-room.component.html',
  styleUrl: './edit-room.component.css',
  providers: [RoomService]
})
export class EditRoomComponent implements OnInit {
  roomId!: number;
  room: Room | null = null;
  roomForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  statusOptions = ['AVAILABLE', 'BOOKED', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'];
  roomTypes = ['Phòng Đơn', 'Phòng Đôi', 'Phòng VIP'];

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private roomService: RoomService
  ) {}

  ngOnInit(): void {
    this.roomForm = this.formBuilder.group({
      tenPhong: ['', Validators.required],
      loaiPhong: ['', Validators.required],
      gia: ['', [Validators.required, Validators.min(0)]],
      tinhTrang: ['', Validators.required],
      tienNghiDiKem: [''],
      moTa: [''],
      anhPhong: [[]]
    });

    // Lấy id phòng từ route
    this.route.params.subscribe(params => {
      this.roomId = +params['id'];
      if (this.roomId) {
        this.loadRoom();
      } else {
        this.error = 'Không tìm thấy ID phòng';
        setTimeout(() => {
          this.router.navigate(['/admin/all-rooms']);
        }, 2000);
      }
    });
  }

  // Getter thuận tiện cho các trường form
  get f() { return this.roomForm.controls; }

  loadRoom() {
    this.loading = true;
    this.roomService.getRoom(this.roomId).subscribe({
      next: (response: any) => {
        if (response && response.status === 200 && response.result) {
          // Trường hợp API trả về đối tượng phòng trong result.content
          if (response.result.content) {
            this.room = response.result.content;
          } 
          // Trường hợp API trả về đối tượng phòng trực tiếp trong result
          else {
            this.room = response.result;
          }
          
          if (this.room) {
            this.roomForm.patchValue({
              tenPhong: this.room.tenPhong,
              loaiPhong: this.room.loaiPhong,
              gia: this.room.gia,
              tinhTrang: this.room.tinhTrang,
              tienNghiDiKem: this.room.tienNghiDiKem,
              moTa: this.room.moTa,
              anhPhong: this.room.anhPhong
            });
          }
        } else if (response && response.id) {
          // Trường hợp API trả về trực tiếp đối tượng phòng
          this.room = response as Room;
          this.roomForm.patchValue(this.room as Room);  // Thêm type assertion
        } else {
          this.error = 'Không thể tải thông tin phòng';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Có lỗi xảy ra khi tải thông tin phòng';
        console.error('Lỗi khi tải thông tin phòng:', error);
        this.loading = false;
      }
    });
  }

  onSubmit() {
    this.submitted = true;
  
    // Dừng nếu form không hợp lệ
    if (this.roomForm.invalid) {
      return;
    }
  
    this.loading = true;
    
    // Tạo đối tượng phòng cập nhật từ form
    let updatedRoom: any;
    
    if (this.room) {
      // Nếu this.room không phải null, kết hợp dữ liệu hiện có với dữ liệu form
      updatedRoom = {
        ...this.room,
        ...this.roomForm.value
      };
    } else {
      // Nếu this.room là null, chỉ sử dụng dữ liệu từ form
      updatedRoom = {
        id: this.roomId,
        ...this.roomForm.value
      };
    }
  
    this.roomService.updateRoom(this.roomId, updatedRoom).subscribe({
      next: () => {
        alert('Cập nhật phòng thành công!');
        this.router.navigate(['/admin/all-rooms']);
      },
      error: (error) => {
        this.error = 'Có lỗi xảy ra khi cập nhật phòng';
        console.error('Lỗi khi cập nhật phòng:', error);
        this.loading = false;
      }
    });
  }

  cancel() {
    this.router.navigate(['/admin/all-rooms']);
  }
}