import { Component } from '@angular/core';
import { AppComponent } from '../../app.component';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [],
  providers: [AppComponent],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.css'
})
export class SigninComponent {
  // constructor(private appComponent: AppComponent) {}

  // ngOnInit() {
  //   console.log('SigninComponent loaded!');
  //   this.appComponent.updateBodyClass(); // Gọi lại phương thức khi component này tải
  // }
}
