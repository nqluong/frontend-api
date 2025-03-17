import { Routes } from '@angular/router';
import { HomeComponent } from './customer/home/home.component';
import { RoomsComponent } from './customer/rooms/rooms.component';
import { RoomDetailsComponent } from './customer/room-details/room-details.component';
import { ContactComponent } from './customer/contact/contact.component';
import { ServiceComponent } from './customer/service/service.component';
import { CustomerComponent } from './customer/customer.component';
import { LoginComponent } from './login/login.component';
import { SigninComponent } from './login/signin/signin.component';
import { SignupComponent } from './login/signup/signup.component';
import { PasswordResetComponent } from './login/password-reset/password-reset.component';

export const routes: Routes = [
    {
        path: '',
        component: CustomerComponent,
        children: [
            {path:'', component: HomeComponent},
            {path: 'rooms', component: RoomsComponent},
            {path: 'room-details', component: RoomDetailsComponent},
            {path: 'contact', component: ContactComponent},
            {path: 'service', component: ServiceComponent}
        ]
    },
    {
        path: 'login',
        component: LoginComponent,
        children:[
            {path: 'signin', component: SigninComponent},
            {path: 'signup', component: SignupComponent}, 
            {path: 'forgot-password', component: PasswordResetComponent}
        ]
    }
];
