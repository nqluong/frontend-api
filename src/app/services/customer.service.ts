import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustomerInfo, CustomerData, StoredCustomerInfo } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = 'http://localhost:8080/hotelbooking';
  private customerStorageKey = 'currentCustomerInfo';

  constructor(private http: HttpClient) { }

  // Phương thức này bây giờ chỉ gửi thông tin khách hàng đến backend
  submitCustomerInfo(bookingId: number, customerInfo: CustomerInfo): Observable<any> {
    // Chuẩn bị dữ liệu gửi đi
    const customerData: CustomerData = this.prepareCustomerData(customerInfo);
    
    // Gửi thông tin khách hàng lên server
    return this.http.put(`${this.apiUrl}/bookings/${bookingId}/customer-info`, customerData);
  }
  
  // Phương thức mới để chuẩn bị dữ liệu khách hàng
  prepareCustomerData(customerInfo: CustomerInfo): CustomerData {
    // Chuẩn bị dữ liệu gửi đi
    const customerData: CustomerData = {
      khachHang: {
        hoTen: customerInfo.fullName,
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
    
    return customerData;
  }

  // Lưu thông tin khách hàng vào localStorage
  storeCustomerInfo(bookingId: number, customerInfo: CustomerInfo): void {
    const storedInfo: StoredCustomerInfo = {
      bookingId: bookingId,
      customerInfo: customerInfo
    };
    localStorage.setItem(this.customerStorageKey, JSON.stringify(storedInfo));
  }

  // Lấy thông tin khách hàng từ localStorage
  getStoredCustomerInfo(): StoredCustomerInfo | null {
    const storedInfo = localStorage.getItem(this.customerStorageKey);
    if (storedInfo) {
      return JSON.parse(storedInfo);
    }
    return null;
  }

  // Xóa thông tin khách hàng từ localStorage
  clearStoredCustomerInfo(): void {
    localStorage.removeItem(this.customerStorageKey);
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