import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

interface Service {
  maDV: number;
  tenDV: string;
  gia: number;
  moTa: string;
}

interface ServiceResponse {
  status: number;
  time: string;
  result: {
    content: Service[];
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
  }
}

@Component({
  selector: 'app-service',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './service.component.html',
  styleUrl: './service.component.css'
})
export class ServiceComponent implements OnInit {
  services: Service[] = [];
  currentPage = 0;
  totalPages = 0;
  isLoading = true;
  error = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(page: number = 0): void {
    this.isLoading = true;
    this.error = false;
    
    this.http.get<ServiceResponse>(`http://localhost:8080/hotelbooking/services?page=${page}&size=9`)
      .subscribe({
        next: (response) => {
          if (response && response.status === 200 && response.result) {
            this.services = response.result.content;
            this.currentPage = page;
            this.totalPages = response.result.totalPages;
            
          } else {
            console.warn('Cấu trúc response không như mong đợi:', response);
            this.services = [];
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading services:', error);
          this.isLoading = false;
          this.error = true;
          this.services = [];
        }
      });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(value);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.loadServices(page);
    }
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
  
  hasServices(): boolean {
    return Array.isArray(this.services) && this.services.length > 0;
  }
}
