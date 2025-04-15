import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RoomService } from '../../services/room.service';
import { HttpClientModule } from '@angular/common/http';

interface Room {
  id?: number;
  tenPhong: string;
  loaiPhong: string;
  gia: number;
  tinhTrang: string;
  tienNghiDiKem: string;
  moTa: string;
  anhPhong: string[];
}

@Component({
  selector: 'app-add-room',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './add-room.component.html',
  styleUrl: './add-room.component.css',
  providers: [RoomService]
})
export class AddRoomComponent implements OnInit {
  roomForm!: FormGroup;
  submitted = false;
  loading = false;
  error = '';
  statusOptions = ['AVAILABLE', 'BOOKED', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'];
  roomTypes = ['Phòng Đơn', 'Phòng Đôi', 'Phòng VIP'];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private roomService: RoomService
  ) {}

  ngOnInit(): void {
    this.roomForm = this.formBuilder.group({
      tenPhong: ['', Validators.required],
      loaiPhong: ['', Validators.required],
      gia: ['', [Validators.required, Validators.min(0)]],
      tinhTrang: ['AVAILABLE', Validators.required],
      tienNghiDiKem: [''],
      moTa: [''],
      anhPhong: [[]]
    });
  }

  // Getter thuận tiện cho các trường form
  get f() { return this.roomForm.controls; }

  onSubmit() {
    this.submitted = true;

    // Dừng nếu form không hợp lệ
    if (this.roomForm.invalid) {
      return;
    }

    this.loading = true;
    
    // Sử dụng type assertion để ép kiểu
    const newRoom = this.roomForm.value as unknown as Room;
    
    this.roomService.addRoom(newRoom).subscribe({
      next: (response: any) => {
        alert('Thêm phòng thành công!');
        this.router.navigate(['/admin/all-rooms']);
      },
      error: (error) => {
        this.error = 'Có lỗi xảy ra khi thêm phòng';
        console.error('Lỗi khi thêm phòng:', error);
        this.loading = false;
      }
    });

    this.createRoom(newRoom);
  }

  // Phương thức tạo phòng
  createRoom(room: Room) {
    this.roomService.addRoom(room).subscribe({
      next: (response: any) => {
        console.log('Thêm phòng thành công:', response);
        alert('Thêm phòng thành công!');
        this.router.navigate(['/admin/all-rooms']);
      },
      error: (error) => {
        console.error('Chi tiết lỗi khi thêm phòng:', error);
        this.error = 'Có lỗi xảy ra khi thêm phòng: ' + error;
        this.loading = false;
      }
    });
  }

  cancel() {
    this.router.navigate(['/admin/all-rooms']);
  }
}