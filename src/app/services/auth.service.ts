import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

declare const FB: any;

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
    token: string;
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
  private fbInitialized = false;

  constructor(private http: HttpClient) {
    this.initFacebookSdk();
  }

  // Initialize Facebook SDK
  initFacebookSdk(): void {
    // Check if we're on HTTPS
    if (window.location.protocol !== 'http:') {
      console.error('Facebook SDK requires HTTPS. Please use https:// for development');
      return;
    }
    
    // Load the Facebook SDK asynchronously
    if (!(window as any).fbAsyncInit) {
      (window as any).fbAsyncInit = () => {
        FB.init({
          appId: '1213805893870945', // Your Facebook App ID
          cookie: true,
          xfbml: true,
          version: 'v21.0'
        });
        this.fbInitialized = true;
      };
  
      // Load the SDK
      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s) as HTMLScriptElement;
        js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode?.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    }
  }

  // Facebook login method that returns an Observable
  facebookLogin(): Observable<{ accessToken: string }> {
    return new Observable(observer => {
      // Ensure FB SDK is loaded
      const checkFB = () => {
        if (typeof FB !== 'undefined') {
          FB.login((response: any) => {
            if (response.authResponse) {
              observer.next({ accessToken: response.authResponse.accessToken });
              observer.complete();
            } else {
              observer.error('User cancelled login or did not fully authorize.');
            }
          }, { scope: 'email,public_profile' });
        } else {
          setTimeout(checkFB, 100); // Check again in 100ms
        }
      };
      
      checkFB();
    });
  }

  // Combined method to handle Facebook login and backend authentication
  loginWithFacebookFlow(): Observable<LoginResponse> {
    return this.facebookLogin().pipe(
      switchMap(response => this.loginWithFacebook(response.accessToken)),
      catchError(error => {
        console.error('Facebook login error:', error);
        return of({
          status: 401,
          time: new Date().toISOString(),
          message: 'Facebook login failed: ' + error,
          result: undefined
        } as LoginResponse);
      })
    );
  }

  // Backend authentication with Facebook token
  loginWithFacebook(accessToken: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/accounts/login/facebook`, { accessToken });
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/accounts/login`, {
      username,
      password
    });
  }

  register(data: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/accounts`, data);
  }

  // Store user info in localStorage
  saveUserData(data: any): void {
    localStorage.setItem('user', JSON.stringify(data));
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
  }

  // Get user data from localStorage
  getUserData(): any {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        return null;
      }
    }
    return null;
  }

  // Clear user data on logout
  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
}