import { Routes } from '@angular/router';
import { MainLoginComponent } from './main-login/main-login.component';
import { SigninComponent } from './signin/signin.component';
import { SignupComponent } from './signup/signup.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { CustomerInfoFormComponent } from './customer-info-form/customer-info-form.component';

export const loginRoutes: Routes = [
  {
    path: '',
    component: MainLoginComponent,
    children: [
      { path: 'signin', component: SigninComponent },
      { path: 'signup', component: SignupComponent },
      { path: 'forgot-password', component: PasswordResetComponent },
      { path: 'customer-info', component: CustomerInfoFormComponent },
      { path: '', redirectTo: 'signin', pathMatch: 'full' }
    ]
  }
]; 