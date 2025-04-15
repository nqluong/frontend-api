import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  template: `
    <div class="d-flex justify-content-center align-items-center vh-100">
      <div class="text-center">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p>Processing Facebook login...</p>
      </div>
    </div>
  `
})
export class OAuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get access token from URL parameters
    this.route.queryParams.subscribe(params => {
      const accessToken = params['access_token'];
      const code = params['code'];  // Facebook might return a code instead of token
      
      if (accessToken) {
        this.completeLogin(accessToken);
      } else if (code) {
        // If you have code instead of token, you would need to exchange it
        // For simplicity, redirect to login page in this case
        console.log('Authorization code received, but direct token exchange not implemented');
        this.router.navigate(['/login/signin']);
      } else {
        console.log('No access token or authorization code found');
        this.router.navigate(['/login/signin']);
      }
    });
  }

  private completeLogin(accessToken: string): void {
    this.authService.loginWithFacebook(accessToken).subscribe({
      next: (response) => {
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
              // Default fallback
              this.router.navigate(['/customer']);
              break;
          }
        } else {
          console.log('Login error:', response.message);
          this.router.navigate(['/login/signin'], { 
            queryParams: { error: response.message } 
          });
        }
      },
      error: (err) => {
        console.log('Facebook login error:', err);
        this.router.navigate(['/login/signin'], { 
          queryParams: { error: 'Failed to process Facebook login' } 
        });
      }
    });
  }
}