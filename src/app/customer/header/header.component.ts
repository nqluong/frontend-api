import { NgIf } from '@angular/common';
import { Component, HostListener, ElementRef, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, NgIf],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  isSticky: boolean = false;
  showDropdown: boolean = false;
  userData: any = null;
  isUserLoggedIn: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    // Try to get user data right away to check login status
    this.checkUserLoginStatus();
    
    // Try again after a short delay
    setTimeout(() => {
      this.checkUserLoginStatus();
    }, 500);
  }

  // Check if user is logged in and get user data
  checkUserLoginStatus(): void {
    try {
      // Get user data first
      this.userData = this.authService.getUserData();
      
      // Then check login status
      this.isUserLoggedIn = this.authService.isLoggedIn();
    } catch (error) {
      console.error('Error checking user login status:', error);
    }
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    this.isSticky = window.scrollY > 100;
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  isLoggedIn(): boolean {
    try {
      // Check cached value first for performance
      if (this.isUserLoggedIn) {
        return true;
      }
      
      // Otherwise query auth service
      this.isUserLoggedIn = this.authService.isLoggedIn();
      return this.isUserLoggedIn;
    } catch (error) {
      console.error('Error in isLoggedIn:', error);
      return false; // Fallback to not logged in if any error
    }
  }

  getUserName(): string {
    try {
      // Get from component cache first
      if (this.userData && this.userData.username) {
        return this.userData.username;
      }
      
      // Otherwise get from service
      const userData = this.authService.getUserData();
      if (userData) {
        this.userData = userData;
        return userData.username || 'Người dùng';
      }
      
      return 'Người dùng';
    } catch (error) {
      console.error('Error in getUserName:', error);
      return 'Người dùng'; // Fallback name
    }
  }

  toggleDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showDropdown = !this.showDropdown;
  }

  logout(): void {
    try {
      this.authService.logout();
      this.showDropdown = false;
      this.userData = null;
      this.isUserLoggedIn = false;
      this.router.navigate(['/customer']);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
}
