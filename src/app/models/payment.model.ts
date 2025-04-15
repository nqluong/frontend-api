export interface PaymentDetail {
  // Trường hợp API trả về tên tiếng Anh
  bookingId?: number;
  roomName?: string;
  checkIn?: string;
  checkOut?: string;
  roomPrice?: number;
  totalDays?: number;
  services?: {
    serviceId: number;
    serviceName: string;
    price: number;
    quantity: number;
    total: number;
  }[];
  totalServiceAmount?: number;
  totalAmount?: number;
  
  // Trường hợp API trả về tên tiếng Việt
  maDatPhong?: number;
  phongInfo?: string;
  giaPhong?: number;
  soNgayThue?: number;
  tongTienPhong?: number;
  dichVuList?: {
    maDv: number;
    tenDv: string;
    gia: number;
    thanhTien: number;
    soLuong: number;
  }[];
  tongTienDichVu?: number;
  tongTienThanhToan?: number;
}

export interface PaymentResponse {
  status: number;
  time: string;
  message: string;
  result: {
    paymentId: string;
    paymentUrl: string;
  }
} 