import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ScriptService } from '../../services/script.service';

@Component({
  selector: 'app-main-admin',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './main-admin.component.html',
  styleUrl: './main-admin.component.css'
})
export class MainAdminComponent implements OnInit {
  constructor(private scriptService: ScriptService) { }

  ngOnInit() {
    const adminScripts = [
      'assets/admin/js/jquery-3.5.1.min.js',
      'assets/admin/js/popper.min.js',
      'assets/admin/js/bootstrap.min.js',
      'assets/admin/plugins/slimscroll/jquery.slimscroll.min.js',
      'assets/admin/js/script.js'
    ];
    this.scriptService.load(adminScripts);
  }
}
