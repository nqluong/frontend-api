import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

interface RoomDisplay {
  id: number;
  tenPhong: string;
  gia: number;
  loaiPhong: string;
  soNguoi: string;
  tienNghi: string[];
}

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.css'
})
export class RoomsComponent implements OnInit {
  searchResults: RoomDisplay[] = [];

  constructor(private route: ActivatedRoute, private router: Router) {
    // Lấy dữ liệu từ navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.searchResults = navigation.extras.state['searchResults'];
      console.log('Navigation state data:', this.searchResults);
    }
  }

  ngOnInit() {
    // Backup plan: Nếu không lấy được từ navigation state, thử lấy từ history state
    if (this.searchResults.length === 0 && window.history.state?.searchResults) {
      this.searchResults = window.history.state.searchResults;
      console.log('History state data:', this.searchResults);
    }
  }
}
