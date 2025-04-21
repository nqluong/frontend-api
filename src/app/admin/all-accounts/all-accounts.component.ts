import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../services/account.service';

export interface Account {
  maTK: number;
  email: string;
  username: string;
  password?: string;
  sdt?: string;
  role: string;
  provider?: string;
  providerId?: string;
  redirectUrl?: string;
  token?: string;
}

@Component({
  selector: 'app-all-account',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './all-accounts.component.html',
})
export class AllAccountComponent implements OnInit {
  accounts: Account[] = [];
  error: string = '';
  loading = false;
  currentPage = 1;
  totalPages = 1;
  totalElements = 0;

  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading = true;
    this.error = '';

    this.accountService.getAll().subscribe({
      next: (data: any) => {
        this.loading = false;

        if (data && data.status === 200 && data.result) {
          // Trường hợp có phân trang
          if (data.result.content) {
            this.accounts = data.result.content;
            this.currentPage = data.result.currentPage;
            this.totalPages = data.result.totalPages;
            this.totalElements = data.result.totalElements;
          } else if (Array.isArray(data.result)) {
            // Trường hợp trả về mảng đơn giản
            this.accounts = data.result;
          }
        } else if (Array.isArray(data)) {
          // Trả về trực tiếp là mảng
          this.accounts = data;
        } else {
          console.error('API trả về dữ liệu không hợp lệ:', data);
          this.error = 'Không thể tải danh sách tài khoản. Vui lòng thử lại sau.';
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Lỗi khi tải tài khoản:', err);
        this.error = 'Không thể tải danh sách tài khoản!';
      }
    });
  }

  deleteAccount(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      this.loading = true;
  
      // Nếu cần xóa dữ liệu liên quan trước, gọi service ở đây (ví dụ: xóa ảnh, xóa liên kết...)
      // Ở đây chỉ xóa tài khoản trực tiếp:
      this.accountService.delete(id).subscribe({
        next: () => {
          this.loading = false;
          alert('Đã xóa tài khoản thành công!');
          this.loadAccounts();
        },
        error: (error) => {
          this.loading = false;
          console.error('Lỗi khi xóa tài khoản:', error);
  
          // Kiểm tra mã lỗi hoặc thông điệp để xác định nếu tài khoản đang được sử dụng
          if (error.status === 400 || error.status === 409) {
            if (
              error.error &&
              error.error.message &&
              (
                error.error.message.includes('Uncategorized error') ||
                error.error.message.includes('liên kết') ||
                error.error.message.includes('đặt phòng') ||
                error.error.message.includes('thanh toán')
              )
            ) {
              alert('Tài khoản này đang được sử dụng hoặc đã liên kết với đặt phòng/thanh toán, không thể xóa!');
            } else {
              alert(error.error.message || 'Xóa tài khoản không thành công. Tài khoản có thể đang được sử dụng.');
            }
          } else {
            alert('Xóa tài khoản không thành công. Vui lòng thử lại sau.');
          }
        }
      });
    }
  }
}
