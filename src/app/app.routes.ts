import { Routes } from '@angular/router';
import { HomeComponent } from './customer/home/home.component';
import { RoomsComponent } from './customer/rooms/rooms.component';
import { RoomDetailsComponent } from './customer/room-details/room-details.component';
import { ContactComponent } from './customer/contact/contact.component';
import { ServiceComponent } from './customer/service/service.component';
import { SigninComponent } from './login/signin/signin.component';
import { OAuthCallbackComponent } from './login/signin/oauth-callback.component';
import { SignupComponent } from './login/signup/signup.component';
import { PasswordResetComponent } from './login/password-reset/password-reset.component';
import { MainCustomerComponent } from './customer/main-customer/main-customer.component';
import { MainLoginComponent } from './login/main-login/main-login.component';
import { HomeComponent as AdminHomeComponent } from './admin/home/home.component';
import { MainAdminComponent } from './admin/main-admin/main-admin.component';
import { SettingsComponent } from './admin/settings/settings.component';
import { ActivitiesComponent } from './admin/activities/activities.component';
import { AddBookingComponent } from './admin/add-booking/add-booking.component';
import { AddCustomerComponent } from './admin/add-customer/add-customer.component';
import { AddPricingComponent } from './admin/add-pricing/add-pricing.component';
import { AddRoleComponent } from './admin/add-role/add-role.component';
import { AddRoomComponent } from './admin/add-room/add-room.component';
import { AddStaffComponent } from './admin/add-staff/add-staff.component';
import { AllBookingComponent } from './admin/all-booking/all-booking.component';
import { AllCustomerComponent } from './admin/all-customer/all-customer.component';
import { AllRoomsComponent } from './admin/all-rooms/all-rooms.component';
import { AllStaffComponent } from './admin/all-staff/all-staff.component';
import { CalendarComponent } from './admin/calendar/calendar.component';
import { EditBookingComponent } from './admin/edit-booking/edit-booking.component';
import { EditCustomerComponent } from './admin/edit-customer/edit-customer.component';
import { EditPricingComponent } from './admin/edit-pricing/edit-pricing.component';
import { EditRoomComponent } from './admin/edit-room/edit-room.component';
import { EditStaffComponent } from './admin/edit-staff/edit-staff.component';
import { InvoiceReportsComponent } from './admin/invoice-reports/invoice-reports.component';
import { InvoiceSettingsComponent } from './admin/invoice-settings/invoice-settings.component';
import { InvoiceViewComponent } from './admin/invoice-view/invoice-view.component';
import { InvoicesComponent } from './admin/invoices/invoices.component';
import { PaymentsComponent } from './admin/payments/payments.component';
import { PricingComponent } from './admin/pricing/pricing.component';
import { RolesPermissionsComponent } from './admin/roles-permissions/roles-permissions.component';
import { CheckoutComponent } from './customer/checkout/checkout.component';
import { PaymentResultComponent } from './customer/payment-result/payment-result.component';
import { ViewBookingComponent } from './admin/view-booking/view-booking.component';
import { AddDichvuComponent } from './admin/add-dichvu/add-dichvu.component';
import { AllDichvuComponent } from './admin/all-dichvu/all-dichvu.component';
import { EditDichvuComponent } from './admin/edit-dichvu/edit-dichvu.component';
import { AddAccountComponent } from './admin/add-account/add-account.component';
import { RevenueComponent } from './admin/revenue/revenue.component';
import { AllAccountComponent } from './admin/all-accounts/all-accounts.component';

export const routes: Routes = [
    { path: '', redirectTo: '/customer', pathMatch: 'full' },
    {
        path: 'login/oauth2/code/facebook',
        component: OAuthCallbackComponent // Cấu hình route cho callback
      },
    { path: '', redirectTo: '/admin', pathMatch: 'full' },
    {
        path: 'admin',
        component: MainAdminComponent,
        children: [
            { path: '', component: AdminHomeComponent },
            { path: 'activities', component: ActivitiesComponent },
            { path: 'add-booking', component: AddBookingComponent },
            { path: 'add-customer', component: AddCustomerComponent },
            { path: 'add-dichvu', component: AddDichvuComponent },
            { path: 'add-pricing', component: AddPricingComponent },
            { path: 'add-role', component: AddRoleComponent },
            { path: 'add-room', component: AddRoomComponent },
            { path: 'add-staff', component: AddStaffComponent },
            { path: 'all-booking', component: AllBookingComponent },
            { path: 'all-customer', component: AllCustomerComponent },
            { path: 'all-dichvu', component: AllDichvuComponent },
            { path: 'all-rooms', component: AllRoomsComponent },
            { path: 'all-staff', component: AllStaffComponent },
            { path: 'calendar', component: CalendarComponent },
            { path: 'edit-booking', component: EditBookingComponent },
            { path: 'edit-customer', component: EditCustomerComponent },
            { path: 'edit-dichvu/:id', component: EditDichvuComponent },
            { path: 'edit-pricing', component: EditPricingComponent },
            { path: 'edit-room/:id', component: EditRoomComponent },
            { path: 'edit-staff', component: EditStaffComponent },
            { path: 'invoice-reports', component: InvoiceReportsComponent },
            { path: 'invoice-view', component: InvoiceViewComponent },
            { path: 'invoices', component: InvoicesComponent },
            { path: 'payments', component: PaymentsComponent },
            { path: 'pricing', component: PricingComponent },
            { path: 'roles-permissions', component: RolesPermissionsComponent },
            { path: 'invoice-settings', component: InvoiceSettingsComponent },
            { path: 'settings', component: SettingsComponent },
            { path: 'view-booking/:id', component: ViewBookingComponent },
            { path: 'all-account', component: AllAccountComponent },
            { path: 'add-account', component: AddAccountComponent },
            { path: 'revenue', component: RevenueComponent },
        ]
    },
    {
        path: 'customer',
        component: MainCustomerComponent,
        children: [
            { path: '', component: HomeComponent },
            { path: 'rooms', component: RoomsComponent },
            { path: 'room-details/:id', component: RoomDetailsComponent },
            { path: 'contact', component: ContactComponent },
            { path: 'service', component: ServiceComponent },
            { path: 'checkout', component: CheckoutComponent },
            { path: 'payment-result', component: PaymentResultComponent }
        ]
    },
    {
        path: 'login',
        loadChildren: () => import('./login/login.routes').then(m => m.loginRoutes)
    }
];
