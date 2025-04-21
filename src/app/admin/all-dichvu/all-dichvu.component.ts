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
              alert('Xóa dịch vụ không thành công. Vui lòng thử lại sau.');
            }
          });
        },
        error: (error) => {
          this.loading = false;
          console.error('Lỗi khi xóa ảnh dịch vụ:', error);
        }
      });
    }
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