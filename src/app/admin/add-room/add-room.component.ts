import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RoomService } from '../../services/room.service';
import { forkJoin, Observable } from 'rxjs';
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
  loading = false;
  submitted = false;
  error = '';
  
  // Các lựa chọn cho dropdown - giữ nguyên giá trị từ backend
  roomTypes = ['Phòng Đơn', 'Phòng Đôi', 'Phòng VIP'];
  statusOptions = ['AVAILABLE', 'BOOKED', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'];
  
  // Biến cho upload ảnh
  selectedFiles: File[] = [];
  previewUrls: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private roomService: RoomService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.roomForm = this.formBuilder.group({
      tenPhong: ['', Validators.required],
      loaiPhong: ['', Validators.required],
      gia: ['', [Validators.required, Validators.min(0)]],
      tinhTrang: ['AVAILABLE', Validators.required],
      tienNghiDiKem: [''],
      moTa: ['']
    });
  }

  // Getter để dễ dàng truy cập form controls
  get f() { return this.roomForm.controls; }

  onFileSelect(event: any) {
    if (event.target.files.length > 0) {
      const files = event.target.files;
      this.selectedFiles = Array.from(files);
      
      // Tạo preview URLs cho các ảnh đã chọn
      this.previewUrls = [];
      this.selectedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrls.push(e.target.result);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  onSubmit() {
    this.submitted = true;
  
    // Dừng nếu form không hợp lệ
    if (this.roomForm.invalid) {
      return;
    }
  
    this.loading = true;
    
    // Format dữ liệu để phù hợp với PhongCreateRequest
    const roomData = {
      tenPhong: this.f['tenPhong'].value,
      loaiPhong: this.f['loaiPhong'].value,
      gia: parseFloat(this.f['gia'].value),  // Chuyển đổi thành số cho BigDecimal
      tinhTrang: this.f['tinhTrang'].value,  // Trường enum RoomStatus
      tienNghiDiKem: this.f['tienNghiDiKem'].value || '',
      moTa: this.f['moTa'].value || '',
      maKS: 1  // Thêm mã khách sạn, nếu có nhiều KS thì cần thêm dropdown chọn KS
    };
  
    console.log('Dữ liệu gửi:', roomData);
  
    // 1. Trước tiên thêm phòng mới
    this.roomService.addRoom(roomData).subscribe({
      next: (roomResponse) => {
        console.log('Phản hồi thêm phòng:', roomResponse);
        // 2. Sau khi thêm phòng thành công, lấy ID phòng để tải lên ảnh
        let roomId;
        
        // Xác định ID từ response (phụ thuộc vào cấu trúc API response)
        if (roomResponse && roomResponse.result) {
          roomId = roomResponse.result.id || roomResponse.result.maPhong; // Kiểm tra cả id và maPhong
        } else if (roomResponse && (roomResponse.id || roomResponse.maPhong)) {
          roomId = roomResponse.id || roomResponse.maPhong;
        }
        
        if (roomId && this.selectedFiles.length > 0) {
          console.log('Đang upload ảnh cho phòng có ID:', roomId);
          // Thêm từng ảnh với roomId
          const uploadObservables: Observable<any>[] = this.selectedFiles.map(file => {
            return this.roomService.addRoomImage(roomId, file);
          });
          
          // Sử dụng forkJoin để đợi tất cả các upload hoàn thành
          forkJoin(uploadObservables).subscribe({
            next: (results) => {
              console.log('Kết quả upload ảnh:', results);
              this.loading = false;
              alert('Thêm phòng thành công!');
              this.router.navigate(['/admin/rooms']);
            },
            error: (error) => {
              console.error('Lỗi khi upload ảnh:', error);
              this.loading = false;
              this.error = 'Phòng đã được tạo nhưng có lỗi khi tải lên ảnh: ' + (error.message || 'Lỗi không xác định');
            }
          });
        } else {
          // Trường hợp không có ảnh hoặc không lấy được ID
          this.loading = false;
          if (!roomId) {
            console.warn('Không thể lấy ID phòng từ response:', roomResponse);
            this.error = 'Thêm phòng thành công nhưng không thể xác định ID phòng.';
          } else {
            alert('Thêm phòng thành công!');
            this.router.navigate(['/admin/rooms']);
          }
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Lỗi khi thêm phòng:', error);
        
        // Hiển thị thông báo lỗi chi tiết hơn
        if (error.error && error.error.message) {
          this.error = `Lỗi: ${error.error.message}`;
        } else {
          this.error = error.message || 'Đã xảy ra lỗi khi thêm phòng. Vui lòng thử lại.';
        }
      }
    });
  }

  cancel() {
    this.router.navigate(['/admin/rooms']);
  }
}