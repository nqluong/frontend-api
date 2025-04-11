import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService, RegisterRequest } from '../../services/auth.service';
import { ValidationService } from '../../services/validation.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  email: string = '';
  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  sdt: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  // Thông báo lỗi cho từng trường
  emailError: string = '';
  usernameError: string = '';
  phoneError: string = '';
  passwordError: string = '';
  confirmPasswordError: string = '';

  constructor(
    private authService: AuthService,
    private validationService: ValidationService,
    private router: Router
  ) {}

  // Kiểm tra validation khi người dùng nhập
  validateField(field: string) {
    switch (field) {
      case 'email':
        this.emailError = this.validationService.getEmailErrorMessage(this.email);
        break;
      case 'username':
        this.usernameError = this.validationService.getUsernameErrorMessage(this.username);
        break;
      case 'phone':
        this.phoneError = this.validationService.getPhoneErrorMessage(this.sdt);
        break;
      case 'password':
        this.passwordError = this.validationService.getPasswordErrorMessage(this.password);
        if (this.confirmPassword) {
          this.validateField('confirmPassword');
        }
        break;
      case 'confirmPassword':
        if (!this.confirmPassword) {
          this.confirmPasswordError = 'Vui lòng xác nhận mật khẩu';
        } else if (this.password !== this.confirmPassword) {
          this.confirmPasswordError = 'Mật khẩu xác nhận không khớp';
        } else {
          this.confirmPasswordError = '';
        }
        break;
    }
  }

  // Kiểm tra tất cả các trường trước khi submit
  validateForm(): boolean {
    this.validateField('email');
    this.validateField('username');
    this.validateField('phone');
    this.validateField('password');
    this.validateField('confirmPassword');

    return !this.emailError && 
           !this.usernameError && 
           !this.phoneError && 
           !this.passwordError && 
           !this.confirmPasswordError;
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const registerData: RegisterRequest = {
      email: this.email,
      username: this.username,
      password: this.password,
      sdt: this.sdt,
      role: 'GUEST',
      provider: 'LOCAL',
      providerId: ''
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 201) {
          this.successMessage = response.message;
          // Chuyển hướng đến trang đăng nhập sau 2 giây
          setTimeout(() => {
            this.router.navigate(['/login/signin']);
          }, 2000);
        } else {
          this.errorMessage = response.message;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.';
      }
    });
  }
}
