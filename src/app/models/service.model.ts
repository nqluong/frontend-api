export interface Service {
  maDV: number;
  tenDV: string;
  gia: number;
  moTa: string;
  anhDV?: string[];
}

export interface ServiceResponse {
  status: number;
  time: string;
  result: {
    content: Service[];
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
  }
}

export interface BookingServiceResponse {
  status: number;
  time: string;
  message: string;
  result: Array<{
    maDDV: number;
    maBooking: number;
    maDv: number;
    tenDv: string;
    gia: number;
    thanhTien: number;
    soLuong: number;
    thoiGianDat: string;
  }>
} 