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
  khachHang: {
    ho: string;
    ten: string;
    ngaySinh: string;
    gioiTinh: string;
    email: string;
    sdt: string;
  };
  taoTaiKhoan: boolean;
  taiKhoan?: {
    username: string;
    password: string;
    email: string;
  };
} 