import { Component, Inject, PLATFORM_ID, Renderer2 } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'QL_KhachSan';
  private previousZone: 'login' | '' | null = null;

  constructor(
    private renderer: Renderer2,
    private router: Router,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          void this.loadStyles().then(() => {
            // Khi CSS đã load xong, thêm class ready vào body
            this.document.body.classList.add('ready');
          });
        }
      });
    }
  }

  /**
   * Xóa tất cả CSS cũ khi chuyển khu vực
   */
  private clearStyles() {
    const oldLinks = this.document.querySelectorAll('link[data-dynamic-style]');
    oldLinks.forEach(link => link.remove());
  }

  /**
   * Xóa tất cả script cũ khi chuyển khu vực
   */
  private clearScripts() {
    const oldScripts = this.document.querySelectorAll('script[data-dynamic-script]');
    oldScripts.forEach(script => script.remove());
  }

  /**
   * Load CSS mới
   */
  private async loadStyles(): Promise<void> {
    const url = this.router.url;

    // CSS chính cần load ngay
    const criticalStyles = url.startsWith('/login') || url.startsWith('/admin')
      ? ['assets/admin/css/bootstrap.min.css', 'assets/admin/css/style.css']
      : ['assets/customer/css/bootstrap.min.css', 'assets/customer/css/style.css'];

    // CSS phụ có thể load sau
    const nonCriticalStyles = url.startsWith('/login') || url.startsWith('/admin')
      ? [
        'assets/admin/plugins/fontawesome/css/fontawesome.min.css',
        'assets/admin/plugins/fontawesome/css/all.min.css',
        'assets/admin/css/feathericon.min.css',
        'assets/admin/plugins/morris/morris.css'
      ]
      : [
        'assets/customer/css/flatpickr.min.css',
        'assets/customer/css/slick-theme.css',
        'assets/customer/css/slick.css'
      ];

    // Load CSS chính trước
    await Promise.all(
      criticalStyles.map((cssFile) => this.loadStylesheet(cssFile, true))
    );

    // Load CSS phụ sau
    Promise.all(
      nonCriticalStyles.map((cssFile) => this.loadStylesheet(cssFile, false))
    );
  }

  private loadStylesheet(href: string, isCritical: boolean): Promise<void> {
    return new Promise((resolve) => {
      if (this.document.querySelector(`link[href="${href}"]`)) {
        resolve();
        return;
      }

      const link = this.renderer.createElement('link');
      if (isCritical) {
        link.rel = 'preload';
        link.as = 'style';
      } else {
        link.rel = 'stylesheet';
      }

      link.href = href;
      link.onload = () => {
        if (isCritical) {
          link.rel = 'stylesheet';
          link.removeAttribute('as');
        }
        resolve();
      };

      this.renderer.appendChild(this.document.head, link);
    });
  }
}
