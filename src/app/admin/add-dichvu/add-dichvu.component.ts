import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DichvuService } from '../../services/dichvu.service';

@Component({
  selector: 'app-add-dichvu',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './add-dichvu.component.html',
  styleUrl: './add-dichvu.component.css',
  providers: [DichvuService]
})
export class AddDichvuComponent implements OnInit {
  dichvuForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  constructor(
    private formBuilder: FormBuilder,
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
  }

  // Getter thuận tiện cho các trường form
  get f() { return this.dichvuForm.controls; }

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
    
    // Tạo dịch vụ
    this.dichvuService.addDichVu(this.dichvuForm.value).subscribe({
      next: (response) => {
        const dichvuId = response.result.maDV || response.result.id || response;
        
        // Nếu có ảnh, upload ảnh sau khi tạo dịch vụ
        if (this.selectedFile) {
          this.dichvuService.addDichVuImage(dichvuId, this.selectedFile).subscribe({
            next: () => {
              this.loading = false;
              alert('Thêm dịch vụ thành công!');
              this.router.navigate(['/admin/all-dichvu']);
            },
            error: (error) => {
              this.loading = false;
              console.error('Lỗi khi thêm ảnh dịch vụ:', error);
              alert('Dịch vụ đã được tạo nhưng không thể thêm ảnh. Bạn có thể thêm ảnh sau.');
              this.router.navigate(['/admin/all-dichvu']);
            }
          });
        } else {
          this.loading = false;
          alert('Thêm dịch vụ thành công!');
          this.router.navigate(['/admin/all-dichvu']);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Lỗi khi thêm dịch vụ:', error);
        this.error = 'Có lỗi xảy ra khi thêm dịch vụ';
      }
    });
  }

  cancel() {
    this.router.navigate(['/admin/all-dichvu']);
  }
}