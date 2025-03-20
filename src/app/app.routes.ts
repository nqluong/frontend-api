import { Routes } from '@angular/router';
import { HomeComponent } from './customer/home/home.component';
import { RoomsComponent } from './customer/rooms/rooms.component';
import { RoomDetailsComponent } from './customer/room-details/room-details.component';
import { ContactComponent } from './customer/contact/contact.component';
import { ServiceComponent } from './customer/service/service.component';
import { SigninComponent } from './login/signin/signin.component';
import { SignupComponent } from './login/signup/signup.component';
import { PasswordResetComponent } from './login/password-reset/password-reset.component';
import { MainCustomerComponent } from './customer/main-customer/main-customer.component';
import { MainLoginComponent } from './login/main-login/main-login.component';
import { HomeComponent as AdminHomeComponent } from './admin/home/home.component';
import { TablesDatatablesComponent } from './admin/tables-datatables/tables-datatables.component';
import { MainAdminComponent } from './admin/main-admin/main-admin.component';
import { SettingsComponent } from './admin/settings/settings.component';

export const routes: Routes = [
    { path: '', redirectTo: '/admin', pathMatch: 'full' },
    {
        path: 'admin',
        component: MainAdminComponent,
        children: [
            { path: '', component: AdminHomeComponent },
            { path: 'tables-datatables', component: TablesDatatablesComponent },
            { path: 'settings', component: SettingsComponent }
        ]
    },
    {
        path: 'customer',
        component: MainCustomerComponent,
        children: [
            { path: '', component: HomeComponent },
            { path: 'rooms', component: RoomsComponent },
            { path: 'room-details', component: RoomDetailsComponent },
            { path: 'contact', component: ContactComponent },
            { path: 'service', component: ServiceComponent }
        ]
    },
    {
        path: 'login',
        component: MainLoginComponent,
        children: [
            { path: 'signin', component: SigninComponent },
            { path: 'signup', component: SignupComponent },
            { path: 'forgot-password', component: PasswordResetComponent }
        ]
    }
];
