import { Component, OnInit } from '@angular/core';
import { ScriptService } from '../../services/script.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {

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
