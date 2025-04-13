import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustomerInfo, CustomerData } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = 'http://localhost:8080/hotelbooking';

  constructor(private http: HttpClient) { }

  submitCustomerInfo(bookingId: number, customerInfo: CustomerInfo): Observable<any> {
    // Tách họ và tên từ fullName
    let ho = '';
    let ten = '';
    
    if (customerInfo.fullName) {
      const nameParts = customerInfo.fullName.trim().split(' ');
      if (nameParts.length > 1) {
        // Lấy phần tử cuối cùng làm tên, các phần tử còn lại làm họ
        ten = nameParts.pop() || '';
        ho = nameParts.join(' ');
      } else {
        // Nếu chỉ có một từ, lấy làm tên
        ten = customerInfo.fullName.trim();
      }
    }
    
    // Chuẩn bị dữ liệu gửi đi
    const customerData: CustomerData = {
      khachHang: {
        ho: ho,
        ten: ten,
        ngaySinh: customerInfo.dateOfBirth,
        gioiTinh: customerInfo.gender,
        email: customerInfo.email,
        sdt: customerInfo.phone
      },
      taoTaiKhoan: customerInfo.createAccount
    };

    // Nếu tạo tài khoản, thêm thông tin tài khoản
    if (customerInfo.createAccount) {
      customerData.taiKhoan = {
        username: customerInfo.username,
        password: customerInfo.password,
        email: customerInfo.email
      };
    }
    
    return this.http.put(`${this.apiUrl}/bookings/${bookingId}/customer-info`, customerData);
  }

  validateCustomerInfo(info: CustomerInfo): boolean {
    if (!info.fullName || 
        !info.dateOfBirth || 
        !info.email || 
        !info.phone) {
      return false;
    }
    
    // Kiểm tra email hợp lệ
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(info.email)) {
      return false;
    }
    
    // Kiểm tra số điện thoại hợp lệ
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(info.phone)) {
      return false;
    }
    
    // Kiểm tra nếu tạo tài khoản thì username và password phải có
    if (info.createAccount) {
      if (!info.username || !info.password || info.password.length < 6) {
        return false;
      }
    }
    
    return true;
  }
} 