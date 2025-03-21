import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ScriptService {
  private scripts: any = {};

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  load(scripts: string[]): Promise<any> {
    if (isPlatformBrowser(this.platformId)) {
      const promises: any[] = [];
      scripts.forEach((script) => promises.push(this.loadScript(script)));
      return Promise.all(promises);
    }
    return Promise.resolve(); // Return empty promise if not in browser
  }

  private loadScript(name: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!isPlatformBrowser(this.platformId)) {
        resolve({ script: name, loaded: true, status: 'Loaded' });
        return;
      }

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = name;
      script.onload = () => {
        resolve({ script: name, loaded: true, status: 'Loaded' });
      };
      script.onerror = (error) => {
        reject({ script: name, loaded: false, status: 'Error', error });
      };
      document.getElementsByTagName('head')[0].appendChild(script);
    });
  }
}