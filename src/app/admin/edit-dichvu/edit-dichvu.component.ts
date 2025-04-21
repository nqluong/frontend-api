import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DichvuService } from '../../services/dichvu.service';

interface DichVu {
  maDV: number;
  tenDV: string;
  moTa: string;
  gia: number;
  anhDV: string[];
  khachSan: any;
}

@Component({
  selector: 'app-edit-dichvu',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './edit-dichvu.component.html',
  styleUrl: './edit-dichvu.component.css',
  providers: [DichvuService]
})
export class EditDichvuComponent implements OnInit {
  dichvuId!: number;
  dichvu: DichVu | null = null;
  dichvuForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  currentImages: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private dichvuService: DichvuService
  ) {}

  ngOnInit(): void {
    this.dichvuForm = this.formBuilder.group({
      tenDV: ['', [Validators.required, Validators.maxLength(100)]],
      moTa: ['', Validators.maxLength(1000)],
      gia: ['', [Validators.required, Validators.min(0), Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      maKS: ['', Validators.required]
    });

    // Lấy id dịch vụ từ route
    this.route.params.subscribe(params => {
      this.dichvuId = +params['id'];
      if (this.dichvuId) {
        this.loadDichVu();
      } else {
        this.error = 'Không tìm thấy ID dịch vụ';
        setTimeout(() => {
          this.router.navigate(['/admin/all-dichvu']);
        }, 2000);
      }
    });
  }

  // Getter thuận tiện cho các trường form
  get f() { return this.dichvuForm.controls; }

  loadDichVu() {
    this.loading = true;
    this.dichvuService.getDichVu(this.dichvuId).subscribe({
      next: (response: any) => {
        if (response && response.status === 200 && response.result) {
          // Trường hợp API trả về đối tượng dịch vụ trong result.content
          if (response.result.content) {
            this.dichvu = response.result.content;
          } 
          // Trường hợp API trả về đối tượng dịch vụ trực tiếp trong result
          else {
            this.dichvu = response.result;
          }
          
          if (this.dichvu) {
            this.dichvuForm.patchValue({
              tenDV: this.dichvu.tenDV,
              moTa: this.dichvu.moTa,
              gia: this.dichvu.gia,
              maKS: this.dichvu.khachSan ? this.dichvu.khachSan.maKS : ''
            });
            
            // Lưu ảnh hiện tại để hiển thị
            this.currentImages = this.dichvu.anhDV || [];
          }
        } else if (response && response.maDV) {
          // Trường hợp API trả về trực tiếp đối tượng dịch vụ
          this.dichvu = response as DichVu;
          this.dichvuForm.patchValue({
            tenDV: this.dichvu.tenDV,
            moTa: this.dichvu.moTa,
            gia: this.dichvu.gia,
            maKS: this.dichvu.khachSan ? this.dichvu.khachSan.maKS : ''
          });
          
          // Lưu ảnh hiện tại để hiển thị
          this.currentImages = this.dichvu.anhDV || [];
        } else {
          this.error = 'Không thể tải thông tin dịch vụ';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Có lỗi xảy ra khi tải thông tin dịch vụ';
        console.error('Lỗi khi tải thông tin dịch vụ:', error);
        this.loading = false;
      }
    });
  }

  onFileChange(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) {
        this.selectedFile = file;
        
        // Xem trước ảnh
        const reader = new FileReader();
        reader.onload = (e) => {
          this.imagePreview = e.target?.result || null;
        };
        reader.readAsDataURL(file); // Sử dụng biến file thay vì this.selectedFile
      }
    }
  }

  // Kiểm tra lỗi và hiển thị thông báo
  getErrorMessage(controlName: string): string {
    const control = this.dichvuForm.get(controlName);
    if (!control) return '';
    
    if (control.hasError('required')) {
      return 'Trường này là bắt buộc';
    }
    if (control.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `Không được vượt quá ${maxLength} ký tự`;
    }
    if (control.hasError('min')) {
      return 'Giá trị phải lớn hơn hoặc bằng 0';
    }
    if (control.hasError('pattern')) {
      return 'Giá tiền không hợp lệ (Chỉ chấp nhận số và tối đa 2 chữ số thập phân)';
    }
    return '';
  }

  onSubmit() {
    this.submitted = true;
    this.error = '';
    
    // Dừng nếu form không hợp lệ
    if (this.dichvuForm.invalid) {
      this.error = 'Vui lòng kiểm tra lại form và điền đầy đủ thông tin bắt buộc';
      return;
    }
    
    this.loading = true;
    
    // Tạo đối tượng dịch vụ cập nhật từ form
    let updatedDichVu: any;
    
    if (this.dichvu) {
      // Nếu this.dichvu không phải null, kết hợp dữ liệu hiện có với dữ liệu form
      updatedDichVu = {
        ...this.dichvu,
        ...this.dichvuForm.value
      };
    } else {
      // Nếu this.dichvu là null, chỉ sử dụng dữ liệu từ form
      updatedDichVu = {
        maDV: this.dichvuId,
        ...this.dichvuForm.value
      };
    }
  
    this.dichvuService.updateDichVu(this.dichvuId, updatedDichVu).subscribe({
      next: () => {
        // Nếu có ảnh mới, thêm ảnh sau khi cập nhật dịch vụ
        if (this.selectedFile) {
          this.dichvuService.addDichVuImage(this.dichvuId, this.selectedFile).subscribe({
            next: () => {
              this.loading = false;
              alert('Cập nhật dịch vụ thành công!');
              this.router.navigate(['/admin/all-dichvu']);
            },
            error: (error) => {
              this.loading = false;
              console.error('Lỗi khi thêm ảnh dịch vụ:', error);
              alert('Dịch vụ đã được cập nhật nhưng không thể thêm ảnh mới.');
              this.router.navigate(['/admin/all-dichvu']);
            }
          });
        } else {
          this.loading = false;
          alert('Cập nhật dịch vụ thành công!');
          this.router.navigate(['/admin/all-dichvu']);
        }
      },
      error: (error) => {
        this.error = 'Có lỗi xảy ra khi cập nhật dịch vụ';
        console.error('Lỗi khi cập nhật dịch vụ:', error);
        this.loading = false;
      }
    });
  }

  cancel() {
    this.router.navigate(['/admin/all-dichvu']);
  }
}