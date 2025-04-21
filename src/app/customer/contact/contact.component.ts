import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HotelsService } from '../../services/hotels.service';
import { Hotel } from '../../models/hotels.model';
import { SafePipe } from '../../pipes/safe.pipe';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, SafePipe],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit {
  hotel: Hotel | null = null;
  mapUrl: string = '';

  constructor(private hotelsService: HotelsService) {}

  ngOnInit(): void {
    this.loadHotel();
  }

  loadHotel(): void {
    this.hotelsService.getHotels().subscribe({
      next: (data) => {
        if (data && data.result && data.result.length > 0) {
          this.hotel = data.result[0]; // Lấy khách sạn đầu tiên từ API
          this.updateMapUrl();
        }
      },
      error: (error) => {
        console.error('Error fetching hotel data:', error);
      }
    });
  }

  updateMapUrl(): void {
    if (this.hotel && this.hotel.diaChi) {
      // Mã hóa địa chỉ để sử dụng trong URL Google Maps
      const encodedAddress = encodeURIComponent(this.hotel.diaChi);
      
      // Sử dụng URL Google Maps đơn giản hơn không yêu cầu API key
      this.mapUrl = `https://maps.google.com/maps?q=${encodedAddress}&output=embed`;
    }
  }
}
