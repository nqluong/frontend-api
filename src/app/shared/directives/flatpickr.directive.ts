import { Directive, ElementRef, Input, AfterViewInit, OnDestroy, NgZone, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import flatpickr from 'flatpickr';
import { Instance as FlatpickrInstance } from 'flatpickr/dist/types/instance';

@Directive({
  selector: '[appFlatpickr]',
  standalone: true
})
export class FlatpickrDirective implements AfterViewInit, OnDestroy {
  @Input() dateFormat = 'Y-m-d';
  @Input() minDate: string | Date = 'today';
  @Input() defaultDate: string | Date | null = null;
  @Input() maxDate: string | Date | null = null;
  @Input() placeholder = 'Chọn ngày';
  @Input() disableMobile = true;
  @Input() allowInput = false;
  @Input() isCheckOut = false;
  @Input() checkInDate: string | null = null;

  @Output() dateChange = new EventEmitter<Date>();

  private flatpickrInstance: FlatpickrInstance | null = null;
  private initAttempts = 0;
  private maxAttempts = 10;
  private retryInterval: any = null;
  private isBrowser: boolean;

  constructor(
    private element: ElementRef,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    // Chỉ khởi tạo flatpickr khi đang ở môi trường browser
    if (this.isBrowser) {
      this.initFlatpickr();

      // Thử lại nếu không thành công
      this.retryInterval = setInterval(() => {
        if (this.flatpickrInstance || this.initAttempts >= this.maxAttempts) {
          clearInterval(this.retryInterval);
          return;
        }
        this.initFlatpickr();
      }, 300);
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      if (this.retryInterval) {
        clearInterval(this.retryInterval);
      }
      this.destroyFlatpickr();
    }
  }

  private initFlatpickr(): void {
    if (!this.isBrowser) return;

    this.initAttempts++;
    try {
      this.ngZone.runOutsideAngular(() => {
        if (typeof flatpickr !== 'function') {
          console.error('Flatpickr not found, loading from CDN');
          this.loadFlatpickrFromCDN();
          return;
        }

        // Xóa instance cũ nếu có
        this.destroyFlatpickr();

        // Cấu hình cho flatpickr
        const config: any = {
          dateFormat: this.dateFormat,
          minDate: this.minDate,
          disableMobile: this.disableMobile,
          allowInput: this.allowInput,
          onChange: (selectedDates: Date[]) => {
            if (selectedDates && selectedDates.length > 0) {
              this.ngZone.run(() => {
                this.dateChange.emit(selectedDates[0]);
              });
            }
          }
        };

        // Thêm ngày mặc định nếu có
        if (this.defaultDate) {
          config.defaultDate = this.defaultDate;
        }

        // Thêm ngày tối đa nếu có
        if (this.maxDate) {
          config.maxDate = this.maxDate;
        }

        // Nếu là check-out và có ngày check-in, thì ngày tối thiểu là ngày check-in + 1
        if (this.isCheckOut && this.checkInDate) {
          const checkIn = new Date(this.checkInDate);
          const nextDay = new Date(checkIn);
          nextDay.setDate(nextDay.getDate() + 1);
          config.minDate = nextDay;
        }

        try {
          this.flatpickrInstance = flatpickr(this.element.nativeElement, config);
          console.log(`Flatpickr initialized (attempt ${this.initAttempts})`);
        } catch (err) {
          console.error('Error creating flatpickr instance:', err);
          this.flatpickrInstance = null;
        }
      });
    } catch (error) {
      console.error('Error initializing flatpickr:', error);
      if (this.initAttempts < this.maxAttempts) {
        setTimeout(() => this.initFlatpickr(), 500);
      }
    }
  }

  private destroyFlatpickr(): void {
    if (this.isBrowser && this.flatpickrInstance && typeof this.flatpickrInstance.destroy === 'function') {
      try {
        this.flatpickrInstance.destroy();
      } catch (error) {
        console.error('Error destroying flatpickr:', error);
      }
      this.flatpickrInstance = null;
    }
  }

  private loadFlatpickrFromCDN(): void {
    if (!this.isBrowser) return;

    try {
      // Kiểm tra xem script đã được tải chưa
      if (document.querySelector('script[src*="flatpickr"]')) {
        return;
      }

      // Tải CSS
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css';
      document.head.appendChild(linkElement);

      // Tải JavaScript
      const scriptElement = document.createElement('script');
      scriptElement.src = 'https://cdn.jsdelivr.net/npm/flatpickr';
      scriptElement.onload = () => {
        console.log('Flatpickr loaded from CDN');
        setTimeout(() => this.initFlatpickr(), 300);
      };
      document.body.appendChild(scriptElement);
    } catch (error) {
      console.error('Error loading flatpickr from CDN:', error);
    }
  }

  // Phương thức để cập nhật giá trị ngày tối thiểu
  public updateMinDate(date: Date): void {
    if (this.isBrowser && this.flatpickrInstance && typeof this.flatpickrInstance.set === 'function') {
      try {
        this.flatpickrInstance.set('minDate', date);
      } catch (error) {
        console.error('Error updating minDate:', error);
      }
    }
  }

  // Phương thức để cập nhật giá trị mặc định
  public setDate(date: Date): void {
    if (this.isBrowser && this.flatpickrInstance && typeof this.flatpickrInstance.setDate === 'function') {
      try {
        this.flatpickrInstance.setDate(date);
      } catch (error) {
        console.error('Error setting date:', error);
      }
    }
  }
} 