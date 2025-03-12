import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderCustomerComponent } from "./components/header-customer/header-customer.component";
import { FooterCustomerComponent } from "./components/footer-customer/footer-customer.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderCustomerComponent, RouterOutlet, FooterCustomerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'QL_KhachSan';
}
