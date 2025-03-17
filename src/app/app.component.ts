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
  private previousZone: 'login' | 'customer' | null = null; 

  constructor(
    private renderer: Renderer2,
    private router: Router,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && isPlatformBrowser(this.platformId)) {
        this.updateBodyClass();

        // Xác định khu vực hiện tại
        const currentZone = this.router.url.startsWith('/login') ? 'login' : 'customer';

        // Nếu chuyển giữa `login` ↔ `customer`, cần xóa hết CSS/JS trước khi load lại
        if (this.previousZone !== null && this.previousZone !== currentZone) {
          this.clearStyles();
          this.clearScripts();
          setTimeout(() => {
            this.loadStyles();
            this.loadScripts();
          }, 50); // Đợi một chút để tránh lỗi
        } else {
          this.loadStyles();
          this.loadScripts();
        }

        this.previousZone = currentZone;
      }
    });
  }

  /**
   * Cập nhật class cho body
   */
  private updateBodyClass() {
    const url = this.router.url;
    this.document.body.removeAttribute('data-theme');
    this.document.body.classList.remove('svgstroke-a', 'auth', 'bg-gradient');

    if (url.startsWith('/login')) {
      this.document.body.setAttribute('data-theme', 'theme-PurpleHeart');
      this.document.body.classList.add('svgstroke-a', 'auth', 'bg-gradient');
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
  private loadStyles() {
    const url = this.router.url;
    let styles: string[] = [];

    if (url.startsWith('/login')) {
      styles = ['assets/admin/css/style.min.css'];
    } else {
      styles = [
        'assets/customer/css/bootstrap.min.css',
        'assets/customer/css/style.css',
        'assets/customer/css/flatpickr.min.css',
        'assets/customer/css/slick-theme.css',
        'assets/customer/css/slick.css'
      ];
    }

    styles.forEach(cssFile => {
      if (!this.document.querySelector(`link[href="${cssFile}"]`)) {
        const link = this.renderer.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssFile;
        link.type = 'text/css';
        link.setAttribute('data-dynamic-style', 'true');
        this.renderer.appendChild(this.document.head, link);
      }
    });
  }

  /**
   * Load JavaScript mới
   */
  private loadScripts() {
    const url = this.router.url;
    let scripts: string[] = [];

    if (!url.startsWith('/login')) {
      scripts = [
        'assets/customer/js/jquery.js',
        'assets/customer/js/bootstrap.min.js',
        'assets/customer/js/popper.min.js',
        'assets/customer/js/slick.min.js',
        'assets/customer/js/slick-animation.min.js',
        'assets/customer/js/flatpickr.js',
        'assets/customer/js/jquery.fancybox.js',
        'assets/customer/js/wow.js',
        'assets/customer/js/appear.js',
        'assets/customer/js/gsap.min.js',
        'assets/customer/js/mixitup.js',
        'assets/customer/js/swiper.min.js',
        'assets/customer/js/ScrollTrigger.min.js',
        'assets/customer/js/SplitText.min.js',
        'assets/customer/js/splitType.js',
        'assets/customer/js/script.js',
        'assets/customer/js/script-gsap.js'
      ];
    }

    scripts.forEach(jsFile => {
      if (!this.document.querySelector(`script[src="${jsFile}"]`)) {
        const script = this.renderer.createElement('script');
        script.src = jsFile;
        script.async = false;
        script.setAttribute('data-dynamic-script', 'true');
        this.renderer.appendChild(this.document.body, script);
      }
    });
  }
}
