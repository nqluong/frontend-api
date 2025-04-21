import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { DichvuService, DichVu } from '../../services/dichvu.service';
import { ApiService } from '../../services/api.service';


@Component({
  selector: 'app-all-dichvu',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  providers: [DichvuService, ApiService],
  templateUrl: './all-dichvu.component.html',
  styleUrl: './all-dichvu.component.css'
})
export class AllDichvuComponent implements OnInit {
  dichvus: DichVu[] = [];
  selectedDichVu?: DichVu;
  currentPage = 1;
  totalPages = 1;
  totalElements = 0;
  loading = false;
  error = '';

  constructor(private dichvuService: DichvuService, private router: Router) {}

  ngOnInit() {
    this.loadDichVus();
  }

  loadDichVus() {
    this.loading = true;
    this.error = '';
    
    this.dichvuService.getAllDichVu().subscribe({
      next: (data: any) => {
        this.loading = false;
        
        // Kiểm tra cấu trúc dữ liệu trả về và xử lý phù hợp
        if (data && data.status === 200 && data.result) {
          // Trường hợp dữ liệu trả về là ApiResponse
          if (data.result.content) {
            this.dichvus = data.result.content;
            this.currentPage = data.result.currentPage;
            this.totalPages = data.result.totalPages;
            this.totalElements = data.result.totalElements;
          } else if (Array.isArray(data.result)) {
            this.dichvus = data.result;
          }
        } else if (Array.isArray(data)) {
          // Trường hợp dữ liệu trả về trực tiếp là mảng DichVu[]
          this.dichvus = data;
        } else {
          console.error('API trả về dữ liệu không hợp lệ:', data);
          this.error = 'Không thể tải dữ liệu dịch vụ. Vui lòng thử lại sau.';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Lỗi khi tải danh sách dịch vụ:', error);
        this.error = 'Đã xảy ra lỗi khi tải danh sách dịch vụ.';
      }
    });
  }

  editDichVu(id: number) {
    this.router.navigate(['/admin/edit-dichvu', id]);
  }

  deleteDichVu(id: number) {
    if (confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      this.loading = true;
      
      // Đầu tiên xóa ảnh của dịch vụ
      this.dichvuService.deleteDichVuImages(id).subscribe({
        next: () => {
          console.log('Đã xóa ảnh dịch vụ thành công');
          
          // Sau khi xóa ảnh thành công, tiếp tục xóa dịch vụ
          this.dichvuService.deleteDichVu(id).subscribe({
            next: () => {
              this.loading = false;
              alert('Đã xóa dịch vụ thành công!');
              this.loadDichVus(); // Tải lại danh sách sau khi xóa
            },
            error: (error) => {
              this.loading = false;
              console.error('Lỗi khi xóa dịch vụ:', error);
              
              // Thêm kiểm tra lỗi chi tiết từ backend (DataIntegrityViolationException)
              if (error.status === 500 && error.error && error.error.message && 
                  (error.error.message.includes('ConstraintViolationException') || 
                   error.error.message.includes('DataIntegrityViolationException'))) {
                alert('Dịch vụ này đang được sử dụng, không thể xóa!');
              } else if (error.status === 400 || error.status === 409) {
                // Kiểm tra thông điệp lỗi cụ thể từ API
                if (error.error && error.error.message && 
                    (error.error.message.includes('Uncategorized error') || 
                     error.error.message.includes('liên kết') ||
                     error.error.message.includes('đang có đặt dịch vụ'))) {
                  alert('Dịch vụ này đang được sử dụng, không thể xóa!');
                } else {
                  // Nếu API trả về thông điệp lỗi, hiển thị nó
                  alert(error.error.message || 'Xóa dịch vụ không thành công. Dịch vụ có thể đang được sử dụng.');
                }
              } else {
                alert('Xóa dịch vụ không thành công. Vui lòng thử lại sau.');
              }
            }
          });
        },
        error: (error) => {
          this.loading = false;
          console.error('Lỗi khi xóa ảnh dịch vụ:', error);
          
          // Nếu không xóa được ảnh, vẫn hỏi người dùng có muốn tiếp tục xóa dịch vụ không
          if (confirm('Không thể xóa ảnh dịch vụ. Bạn vẫn muốn tiếp tục xóa dịch vụ không?')) {
            this.deleteOnlyDichVu(id);
          }
        }
      });
    }
  }

  // Thêm phương thức này để tái sử dụng khi chỉ muốn xóa dịch vụ mà không xóa ảnh
  deleteOnlyDichVu(id: number) {
    this.dichvuService.deleteDichVu(id).subscribe({
      next: () => {
        this.loading = false;
        alert('Đã xóa dịch vụ thành công!');
        this.loadDichVus();
      },
      error: (error) => {
        this.loading = false;
        console.error('Lỗi khi xóa dịch vụ:', error);
        
        if (error.status === 500 && error.error && error.error.message && 
            (error.error.message.includes('ConstraintViolationException') || 
            error.error.message.includes('DataIntegrityViolationException'))) {
          alert('Dịch vụ này đang được sử dụng, không thể xóa!');
        } else {
          alert('Xóa dịch vụ không thành công. Vui lòng thử lại sau.');
        }
      }
    });
  }

  // Phương thức để hiển thị preview ảnh dịch vụ
  getFirstImageUrl(dichvu: DichVu): string {
    if (dichvu.anhDV && dichvu.anhDV.length > 0) {
      return dichvu.anhDV[0];
    }
    return 'assets/images/no-image.png'; // Ảnh mặc định nếu không có ảnh
  }

  addDichVu() {
    this.router.navigate(['/admin/add-dichvu']);
  }
}