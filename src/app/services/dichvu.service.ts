import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DichVu {
  maDV: number;
  tenDV: string;
  moTa: string;
  gia: number;
  anhDV: string[];
  khachSan: any;
}

@Injectable({
  providedIn: 'root'
})
export class DichvuService {
  private apiUrl = 'http://localhost:8080/hotelbooking/services';
  private serviceImagesUrl = 'http://localhost:8080/hotelbooking/service-images';

  constructor(private http: HttpClient) { }

  // Lấy danh sách tất cả dịch vụ
  getAllDichVu(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // Lấy thông tin chi tiết dịch vụ theo ID
  getDichVu(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Thêm dịch vụ mới (không có ảnh)
  addDichVu(dichvuData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, dichvuData);
  }

  // Thêm ảnh cho dịch vụ
  addDichVuImage(dichvuId: number, file: File | null): Observable<any> {
    // Kiểm tra nếu file là null thì trả về Observable lỗi
    if (!file) {
      return new Observable(observer => {
        observer.error('Không có file được chọn');
        observer.complete();
      });
    }
    
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
          maDV: dichvuId,
          duongDan: fileName // Chỉ lưu tên file và định dạng
        };
        
        this.http.post<any>(this.serviceImagesUrl, imageRequest).subscribe({
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

  // Cập nhật thông tin dịch vụ
  updateDichVu(id: number, dichvuData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dichvuData);
  }

  // Xóa dịch vụ
  deleteDichVu(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Xóa ảnh của dịch vụ
  deleteDichVuImages(dichvuId: number): Observable<any> {
    return this.http.delete<any>(`${this.serviceImagesUrl}/byService/${dichvuId}`);
  }
}