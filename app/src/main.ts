import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

// @ts-ignore
import { QRCode } from 'webcomponent-qr-code';

customElements.define('ext-qr-code', QRCode);

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
