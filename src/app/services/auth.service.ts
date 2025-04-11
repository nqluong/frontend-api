import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginResponse {
  status: number;
  time: string;
  message: string;
  result?: {
    maTK: number;
    email: string;
    username: string;
    password: string;
    sdt: string;
    role: 'ADMIN' | 'USER' | 'GUEST';
    provider: 'FACEBOOK' | 'GOOGLE' | 'LOCAL';
    providerId: string;
    redirectUrl: string;
  };
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  sdt: string;
  role: 'ADMIN' | 'USER' | 'GUEST';
  provider: 'FACEBOOK' | 'GOOGLE' | 'LOCAL';
  providerId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8080/hotelbooking';

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/accounts/login`, {
      username,
      password
    });
  }

  register(data: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/accounts`, data);
  }
} 