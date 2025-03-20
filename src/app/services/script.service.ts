import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScriptService {
  private scripts: any = {};
  constructor() { }
  load(scripts: string[]): Promise<any> {
    const promises: any[] = [];
    scripts.forEach((script) => promises.push(this.loadScript(script)));
    return Promise.all(promises);
  }

  private loadScript(name: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = name;
      script.onload = () => {
        resolve({ script: name, loaded: true, status: 'Loaded' });
      };
      script.onerror = () => {
        reject({ script: name, loaded: false, status: 'Loaded' });
      };
      document.getElementsByTagName('head')[0].appendChild(script);
    });
  }
}
