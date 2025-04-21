import { Component } from '@angular/core';
import { AppComponent } from '../../app.component';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  providers: [AppComponent],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.css'
})
export class SigninComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.status === 200) {
          // Save user data
          if (response.result) {
            this.authService.saveUserData(response.result);
          }
          
          // Redirect based on role
          if (response.result?.role === 'ADMIN') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/customer']);
          }
        } else {
          // Handle API error
          this.errorMessage = response.message;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Login error. Please try again later.';
        console.error('Login error:', error);
      }
    });
  }
  
  onFacebookLogin() {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.loginWithFacebookFlow().subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.status === 200) {
          // Save user data
          if (response.result) {
            this.authService.saveUserData(response.result);
          }
          
          // Redirect based on role
          const role = response.result?.role?.toUpperCase();
          switch (role) {
            case 'ADMIN':
              this.router.navigate(['/admin']);
              break;
            case 'GUEST':
            case 'USER':
              this.router.navigate(['/customer']);
              break;
            default:
              this.errorMessage = 'Invalid user role.';
              break;
          }
        } else {
          this.errorMessage = response.message || 'Login failed.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Error during Facebook login.';
        console.error('Facebook login error:', error);
      }
    });
  }
}