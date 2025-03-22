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
      // 1️⃣ CÁC THƯ VIỆN CƠ BẢN
      'assets/admin/js/jquery-3.5.1.min.js', // jQuery luôn load đầu tiên
      'assets/admin/js/moment.min.js', // Moment.js load sớm để dùng cho DateTimePicker
      'assets/admin/js/popper.min.js', // Popper.js trước Bootstrap
      'assets/admin/js/bootstrap.min.js', // Bootstrap
    
      // 2️⃣ CÁC PLUGIN HỖ TRỢ
      'assets/admin/js/jquery-ui.min.js', // jQuery UI trước các plugin cần nó
      'assets/admin/plugins/slimscroll/jquery.slimscroll.min.js', // Slimscroll hỗ trợ UI
    
      // 3️⃣ CÁC THƯ VIỆN CHART & FULLCALENDAR
      'assets/admin/plugins/raphael/raphael.min.js', // Raphael.js trước Morris.js
      'assets/admin/plugins/morris/morris.min.js', // Morris.js cần Raphael.js
      'assets/admin/plugins/fullcalendar/fullcalendar.min.js', // FullCalendar
      'assets/admin/plugins/fullcalendar/jquery.fullcalendar.js', // Plugin FullCalendar cho jQuery
    
      // 4️⃣ CÁC PLUGIN GIAO DIỆN
      'assets/admin/plugins/summernote/dist/summernote-bs4.min.js', // Summernote
      'assets/admin/plugins/datatables/jquery.dataTables.min.js', // DataTables jQuery
      'assets/admin/plugins/datatables/datatables.min.js', // DataTables
    
      // 5️⃣ CÁC PLUGIN HỖ TRỢ GIAO DIỆN KHÁC
      'assets/admin/js/bootstrap-datetimepicker.min.js', // DateTimePicker (sau Moment.js)
      'assets/admin/js/select2.min.js', // Select2 hỗ trợ dropdown nâng cao
    
      // 6️⃣ SCRIPT CUSTOM CỦA DỰ ÁN
      'assets/admin/js/script.js' // Script riêng của bạn, luôn load sau cùng
    ];
    
    this.scriptService.load(adminScripts);
  }
}
