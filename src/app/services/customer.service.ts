import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Customer {
  maKH: number;
  hoTen: string;
  ngaySinh: string;
  gioiTinh: string;
  email: string;
  sdt: string;
  maTK: number;
}

interface ApiResponse<T> {
  status: number;
  time: string;
  message: string;
  result: T;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private apiUrl = 'http://localhost:8080/hotelbooking/customers'; // Cập nhật URL nếu cần

  constructor(private http: HttpClient) {}

  // Gọi API mới để lấy thông tin khách hàng theo mã khách hàng (maKH)
  getCustomerByMaKH(maKH: number): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.apiUrl}/byMaKH/${maKH}`);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map, of } from 'rxjs';
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
    console.log('Chuẩn bị gửi thông tin khách hàng đến backend:', { bookingId, customerInfo });
    
    // Chuẩn bị dữ liệu gửi đi
    const customerData: CustomerData = this.prepareCustomerData(customerInfo);
    console.log('Dữ liệu khách hàng đã chuẩn bị:', customerData);
    
    // Gửi thông tin khách hàng lên server
    return this.http.put(`${this.apiUrl}/bookings/${bookingId}/customer-info`, customerData)
      .pipe(
        catchError(error => {
          console.error('Lỗi gửi thông tin khách hàng:', error);
          return throwError(() => error);
        })
      );
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
  storeCustomerInfo(bookingId: number, customerInfo: CustomerInfo, isAlternativeInfo?: boolean): void {
    const storedInfo: StoredCustomerInfo = {
      bookingId: bookingId,
      customerInfo: customerInfo,
      isAlternativeInfo: isAlternativeInfo || false
    };
    localStorage.setItem(this.customerStorageKey, JSON.stringify(storedInfo));
  }

  // Lấy thông tin khách hàng từ localStorage
  getStoredCustomerInfo(): StoredCustomerInfo | null {
    try {
      const storedInfo = localStorage.getItem(this.customerStorageKey);
      if (storedInfo) {
        const parsedInfo = JSON.parse(storedInfo);
        console.log('Đã lấy thông tin khách hàng từ localStorage:', parsedInfo);
        return parsedInfo;
      }
    } catch (error) {
      console.error('Lỗi khi đọc thông tin khách hàng từ localStorage:', error);
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

  // Create a new account
  createAccount(accountData: {
    email: string;
    username: string;
    password: string;
    sdt: string;
    role?: string;
  }): Observable<any> {
    // Set default role if not provided
    const data = {
      ...accountData,
      role: accountData.role || 'GUEST'
    };
    
    console.log('Creating account with data:', data);
    
    return this.http.post(`${this.apiUrl}/accounts`, data)
      .pipe(
        map(response => {
          console.log('Account creation response:', response);
          
          // Check if response contains error status (API might return errors in success branch)
          if (response && 'status' in response) {
            if ((response as any).status === 400) {
              // If response has error status, throw an error to be caught by the error handler
              throw {
                error: response
              };
            } else if ((response as any).status === 201) {
              // This is a successful account creation
              console.log('Account created successfully with status 201');
              return response;
            }
          }
          return response;
        }),
        catchError(error => {
          console.error('Error creating account:', error);
          
          // Improve error handling to extract validation messages
          let errorResponse = error;
          
          // Check if the error is a proper API response (with status code 400/etc)
          if (error.error && error.error.status === 400 && error.error.message) {
            // This is a structured API error from our backend
            const apiError = {
              status: error.error.status,
              message: error.error.message,
              // Add any other fields from the API error response
              time: error.error.time
            };
            
            console.log('Received API error:', apiError);
            errorResponse = {
              ...error,
              error: apiError // Replace generic error with parsed API error
            };
          }
          
          // Return the enhanced error for better error handling in the component
          return throwError(() => errorResponse);
        })
      );
  }
} 