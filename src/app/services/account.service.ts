import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Account {
    maTK: number;
    email: string;
    username: string;
    password?: string;
    sdt?: string;
    role: string;
    provider?: string;
    providerId?: string;
    redirectUrl?: string;
    token?: string;
  }

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = 'http://localhost:8080/hotelbooking/accounts';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Account[]> {
    return this.http.get<Account[]>(this.apiUrl);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  getAccount(id: number): Observable<Account> {
    return this.http.get<Account>(`${this.apiUrl}/${id}`);
  }

  updateAccount(id: number, account: Partial<Account>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, account);
  }

  // Thêm các hàm create, update nếu cần
}