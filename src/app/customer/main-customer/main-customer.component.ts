import { Component, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { ScriptService } from '../../services/script.service';
@Component({
  selector: 'app-main-customer',
  standalone: true,
  imports:[RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './main-customer.component.html',
  styleUrl: './main-customer.component.css'
})
export class MainCustomerComponent  implements OnInit {
  constructor(private scriptService: ScriptService) { }

  ngOnInit() {
    const customerScripts = [
      'assets/customer/js/jquery.js', // Ensure jQuery is loaded first
      'assets/customer/js/jquery.fancybox.js',
      'assets/customer/js/popper.min.js',
      'assets/customer/js/bootstrap.min.js',
      'assets/customer/js/slick.min.js',
      'assets/customer/js/slick-animation.min.js',
      'assets/customer/js/wow.js',
      'assets/customer/js/appear.js',
      'assets/customer/js/mixitup.js',
      'assets/customer/js/flatpickr.js',
      'assets/customer/js/swiper.min.js',
      'assets/customer/js/gsap.min.js',
      'assets/customer/js/ScrollTrigger.min.js',
      'assets/customer/js/SplitText.min.js',
      'assets/customer/js/splitType.js',
      'assets/customer/js/script.js',
      'assets/customer/js/script-gsap.js'
    ];
    this.scriptService.load(customerScripts);
  }
}
