import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Room {
  id?: number;
  tenPhong: string;
  loaiPhong: string;
  gia: number;
  tinhTrang: string;
  tienNghiDiKem: string;
  moTa: string;
  anhPhong: string[];
}

interface ApiResponse {
  status: number;
  time: string;
  result: {
    content: Room[];
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private apiUrl = 'http://localhost:8080/hotelbooking/rooms'; // Đường dẫn API của bạn

  constructor(private http: HttpClient) {}

  getAllRooms(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(this.apiUrl);
  }

  getRoom(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/${id}`);
  }

  addRoom(room: Room): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.apiUrl, room);
  }

  updateRoom(id: number, room: Room): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/${id}`, room);
  }

  deleteRoom(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`);
  }
}