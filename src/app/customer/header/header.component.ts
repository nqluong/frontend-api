import { NgIf } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, NgIf],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  isSticky: boolean = false;

  @HostListener('window:scroll', [])
  onScroll(): void {
    this.isSticky = window.scrollY > 100;
  }
}
