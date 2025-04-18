export interface CustomerInfo {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  createAccount: boolean;
  username: string;
  password: string;
}

export interface CustomerData {
  hoTen: string;
  ngaySinh: string;
  gioiTinh: string;
  email: string;
  sdt: string;
  username?: string;
  password?: string;
  taoTaiKhoan?: boolean;  // Flag to indicate if user wants to create an account
}

// Interface để lưu thông tin khách hàng trong localStorage
export interface StoredCustomerInfo {
  bookingId: number;
  customerInfo: CustomerInfo;
} 