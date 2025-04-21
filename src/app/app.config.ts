import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withNoXsrfProtection } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
// Tạm comment phần này để tắt SSR
// import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), 
    // Tạm thời tắt SSR để tránh lỗi localStorage
    // provideClientHydration(),
    // Thêm withNoXsrfProtection để tránh lỗi XSRF
    provideHttpClient(withFetch(), withNoXsrfProtection()),
    provideAnimations()
  ]
};
