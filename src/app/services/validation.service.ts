import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  // Kiểm tra email hợp lệ
  isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailRegex.test(email);
  }

  // Kiểm tra username hợp lệ (chỉ cho phép chữ cái, số và dấu gạch dưới, độ dài 3-20 ký tự)
  isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  // Kiểm tra số điện thoại hợp lệ (10 số, bắt đầu bằng 0)
  isValidPhone(phone: string): boolean {
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(phone);
  }

  // Kiểm tra mật khẩu hợp lệ (ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số)
  isValidPassword(password: string): boolean {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return passwordRegex.test(password);
  }

  // Lấy thông báo lỗi cho email
  getEmailErrorMessage(email: string): string {
    if (!email) return 'Email không được để trống';
    if (!this.isValidEmail(email)) return 'Email không hợp lệ';
    return '';
  }

  // Lấy thông báo lỗi cho username
  getUsernameErrorMessage(username: string): string {
    if (!username) return 'Tên đăng nhập không được để trống';
    if (!this.isValidUsername(username)) return 'Tên đăng nhập phải từ 3-20 ký tự, chỉ bao gồm chữ cái, số và dấu gạch dưới';
    return '';
  }

  // Lấy thông báo lỗi cho số điện thoại
  getPhoneErrorMessage(phone: string): string {
    if (!phone) return 'Số điện thoại không được để trống';
    if (!this.isValidPhone(phone)) return 'Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và có 10 số)';
    return '';
  }

  // Lấy thông báo lỗi cho mật khẩu
  getPasswordErrorMessage(password: string): string {
    if (!password) return 'Mật khẩu không được để trống';
    if (!this.isValidPassword(password)) return 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số';
    return '';
  }
} 