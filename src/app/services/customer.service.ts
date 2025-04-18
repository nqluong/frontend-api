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
    // Chuẩn bị dữ liệu cơ bản
    const customerData: any = {
      hoTen: customerInfo.fullName,
      ngaySinh: customerInfo.dateOfBirth,
      gioiTinh: customerInfo.gender,
      email: customerInfo.email,
      sdt: customerInfo.phone,
      taoTaiKhoan: customerInfo.createAccount
    };

    // Nếu tạo tài khoản, thêm thông tin tài khoản
    if (customerInfo.createAccount) {
      customerData.username = customerInfo.username;
      customerData.password = customerInfo.password;
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

  // Kiểm tra tính hợp lệ của thông tin khách hàng
  validateCustomerInfo(customerInfo: CustomerInfo): boolean {
    // Kiểm tra các trường bắt buộc
    if (!customerInfo.fullName || !customerInfo.fullName.trim()) return false;
    if (!customerInfo.dateOfBirth) return false;
    if (!customerInfo.email || !customerInfo.email.trim()) return false;
    if (!customerInfo.phone || !customerInfo.phone.trim()) return false;
    
    // Kiểm tra email hợp lệ
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) return false;
    
    // Kiểm tra số điện thoại hợp lệ
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(customerInfo.phone)) return false;
    
    // Kiểm tra thông tin tài khoản nếu người dùng chọn tạo tài khoản
    if (customerInfo.createAccount) {
      if (!customerInfo.username || !customerInfo.username.trim()) return false;
      if (!customerInfo.password || customerInfo.password.length < 6) return false;
    }
    
    return true;
  }
} 