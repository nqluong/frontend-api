import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Account {
  maTK?: number;
  email: string;
  username: string;
  password: string;
  sdt: string;
  role: string;
  provider: string;
  providerId: string;
  redirectUrl?: string;
  token?: string;
}

export interface ApiResponse<T> {
  status: number;
  time: string;
  message: string;
  result: T;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = 'http://localhost:8080/hotelbooking/accounts';

  constructor(private http: HttpClient) {}

  // GET /accounts
  getAccounts(): Observable<ApiResponse<Account[]>> {
    return this.http.get<ApiResponse<Account[]>>(this.apiUrl);
  }

  // POST /accounts
  addAccount(account: Account): Observable<ApiResponse<Account>> {
    return this.http.post<ApiResponse<Account>>(this.apiUrl, account);
  }

  // PUT /accounts/{id}
  updateAccount(id: number, accountUpdate: { password: string; sdt: string }): Observable<ApiResponse<Account>> {
    return this.http.put<ApiResponse<Account>>(`${this.apiUrl}/${id}`, accountUpdate);
  }

  // DELETE /accounts/{id}
  deleteAccount(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${id}`);
  }
}
