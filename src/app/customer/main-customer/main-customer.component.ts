import { Component, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import flatpickr from 'flatpickr';
@Component({
  selector: 'app-main-customer',
  standalone: true,
  imports:[RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './main-customer.component.html',
  styleUrl: './main-customer.component.css'
})
export class MainCustomerComponent  {

}
