import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl, SafeScript, SafeStyle, SafeUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safe',
  standalone: true
})
export class SafePipe implements PipeTransform {
  
  constructor(private sanitizer: DomSanitizer) {}
  
  transform(value: string, type: string): SafeHtml | SafeResourceUrl | SafeScript | SafeStyle | SafeUrl {
    switch (type) {
      case 'html':
        return this.sanitizer.bypassSecurityTrustHtml(value);
      case 'resourceUrl':
        return this.sanitizer.bypassSecurityTrustResourceUrl(value);
      case 'script':
        return this.sanitizer.bypassSecurityTrustScript(value);
      case 'style':
        return this.sanitizer.bypassSecurityTrustStyle(value);
      case 'url':
        return this.sanitizer.bypassSecurityTrustUrl(value);
      default:
        return this.sanitizer.bypassSecurityTrustResourceUrl(value);
    }
  }
} 