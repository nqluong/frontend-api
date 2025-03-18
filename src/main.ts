import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  ...appConfig, // Merge appConfig vào
  providers: [...(appConfig.providers || []), provideClientHydration()] // Thêm provideClientHydration() vào danh sách providers
})
  .catch((err) => console.error(err));
