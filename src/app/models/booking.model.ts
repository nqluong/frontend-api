export interface BookingResponse {
  status: number;
  time: string;
  message: string;
  result: {
    maDP: number;
    maKH: number;
    tenKH: string;
    maPhong: number;
    tenPhong: string;
    ngayDat: string;
    ngayDen: string;
    ngayDi: string;
    trangThai: string;
  }
}

export interface RoomDisplay {
  id: number;
  tenPhong: string;
  gia: number;
  loaiPhong: string;
  soNguoi: string;
  tienNghi: string[];
} 