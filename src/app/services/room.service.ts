import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private apiUrl = 'http://localhost:8080/hotelbooking/rooms'; // Thay bằng URL API của bạn

  constructor(private http: HttpClient) {}

  // Hàm lấy danh sách loại phòng
  getRoomTypes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/typeroom`);
  }
}
