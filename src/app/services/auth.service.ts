import { Injectable, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

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
  private userDataCache: any = null;
  private tokenCache: string | null = null;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.initFacebookSdk();
      this.loadUserDataFromStorage();
    }
  }

  // Initialize Facebook SDK
  initFacebookSdk(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
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
    if (!isPlatformBrowser(this.platformId)) {
      return of({ accessToken: '' });
    }
    
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

  // Load user data from localStorage to memory cache
  private loadUserDataFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        // Load token
        this.tokenCache = localStorage.getItem('token');
        
        // Load user data
        const userData = localStorage.getItem('user');
        
        if (userData) {
          this.userDataCache = JSON.parse(userData);
        }
      } catch (error) {
        console.error('Error loading user data from localStorage:', error);
      }
    }
  }

  // Store user info in localStorage
  saveUserData(data: any): void {
    console.log('Lưu thông tin người dùng:', data);
    this.userDataCache = data;
    
    if (data.token) {
      this.tokenCache = data.token;
    }
    
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem('user', JSON.stringify(data));
        console.log('Đã lưu thông tin người dùng vào localStorage');
        
        if (data.token) {
          localStorage.setItem('token', data.token);
          console.log('Đã lưu token người dùng vào localStorage');
        }
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }

  // Get user data from localStorage
  getUserData(): any {
    // Return from cache if available
    if (this.userDataCache) {
      return this.userDataCache;
    }
    
    // Otherwise try to get from localStorage if in browser
    if (isPlatformBrowser(this.platformId)) {
      try {
        const userData = localStorage.getItem('user');
        
        if (userData) {
          try {
            this.userDataCache = JSON.parse(userData);
            return this.userDataCache;
          } catch (error) {
            console.error('Error parsing user data from localStorage:', error);
            return null;
          }
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
      }
    }
    return null;
  }

  // Clear user data on logout
  logout(): void {
    this.userDataCache = null;
    this.tokenCache = null;
    
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } catch (error) {
        console.error('Error removing from localStorage:', error);
      }
    }
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    // Check cache first for token
    if (this.tokenCache) {
      return true;
    }
    
    // Check cache for user data
    if (this.userDataCache) {
      return true;
    }
    
    // Then check localStorage if in browser
    if (isPlatformBrowser(this.platformId)) {
      try {
        // First check if user data exists
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            this.userDataCache = JSON.parse(userData);
            return true;
          } catch (error) {
            console.error('Error parsing user data from localStorage:', error);
          }
        }
        
        // If user data not found, check for token as fallback
        const hasToken = !!localStorage.getItem('token');
        if (hasToken) {
          this.tokenCache = localStorage.getItem('token');
          return true;
        }
      } catch (error) {
        console.error('Error checking login status in localStorage:', error);
      }
    }
    
    return false;
  }
}