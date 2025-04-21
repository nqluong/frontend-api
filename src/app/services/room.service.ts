import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private apiUrl = 'http://localhost:8080/hotelbooking/rooms';
  private roomImagesUrl = 'http://localhost:8080/hotelbooking/room-images';

  constructor(private http: HttpClient) { }

  // Lấy danh sách tất cả các phòng
  getAllRooms(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // Lấy thông tin chi tiết phòng theo ID
  getRoom(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Thêm phòng mới (không có ảnh)
  addRoom(roomData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, roomData);
  }

  // Thêm ảnh cho phòng
  addRoomImage(roomId: number, file: File): Observable<any> {
    // Lấy tên file và định dạng
    const fileName = file.name;
    
    // Chuyển đổi File thành Base64 để gửi
    return new Observable(observer => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Loại bỏ phần prefix "data:image/xxx;base64,"
        const base64Data = base64String.split(',')[1];
        
        const imageRequest = {
          maPhong: roomId,
          duongDan: fileName // Chỉ lưu tên file và định dạng
        };
        
        this.http.post<any>(this.roomImagesUrl, imageRequest).subscribe({
          next: (response) => observer.next(response),
          error: (error) => observer.error(error),
          complete: () => observer.complete()
        });
      };
      reader.onerror = (error) => {
        observer.error(error);
      };
    });
  }

  // Cập nhật thông tin phòng (không có ảnh)
  updateRoom(id: number, roomData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, roomData);
  }

  // Xóa phòng
  deleteRoom(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Xóa ảnh của phòng
  deleteRoomImages(id: number): Observable<any> {
    return this.http.delete<any>(`${this.roomImagesUrl}/${id}`);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private apiUrl = 'http://localhost:8080/hotelbooking/rooms'; 

  constructor(private http: HttpClient) {}

  // Hàm lấy danh sách loại phòng
  getRoomTypes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/typeroom`);
  }
  
  // Hàm lấy tất cả các phòng với phân trang
  getAllRooms(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&size=${size}`);
  }
  
  // Hàm lấy chi tiết phòng theo ID
  getRoomById(roomId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${roomId}`);
  }

  // Hàm lấy danh sách booking của một phòng
  getRoomBookings(roomId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${roomId}/bookings`);
  }
}