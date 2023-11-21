import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DATE_FNS_FORMATS, MatDateFnsModule } from '@angular/material-date-fns-adapter';
import { enAU } from 'date-fns/locale';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { provideLoginContext } from './oauth/login-service';
import { provideLocalStorage } from './utils/local-storage';
import { provideExternalNavigation } from './utils/router-utils';
import { APP_BASE_HREF, PlatformLocation } from '@angular/common';
import { BASE_API_MATCHERS, authorizationInterceptorProviders } from './oauth/auth-interceptor';
import { MatButtonModule } from '@angular/material/button';
import { BodyScrollbarHidingService } from './utils/body-scrollbar-hiding.service';
import { uniModelServiceProviders } from './uni/uni';
import { labModelServiceProviders } from './lab/lab-model-providers';
import { FileUploadService } from './common/file/file-upload.service';
import { API_BASE_URL } from './common/model/model-service';

/**
 * This function is used internal to get a string instance of the `<base href="" />` value from `index.html`.
 * This is an exported function, instead of a private function or inline lambda, to prevent this error:
 *
 * `Error encountered resolving symbol values statically.`
 * `Function calls are not supported.`
 * `Consider replacing the function or lambda with a reference to an exported function.`
 *
 * @param platformLocation an Angular service used to interact with a browser's URL
 * @return a string instance of the `<base href="" />` value from `index.html`
 */
export function getBaseHref(platformLocation: PlatformLocation): string {
  return platformLocation.getBaseHrefFromDOM();
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,

    MatButtonModule,
    MatDateFnsModule
  ],
  providers: [
    {
      provide: API_BASE_URL,
      useValue: '/api'
    },
    ...provideLocalStorage(),
    ...provideExternalNavigation(),
    { provide: MAT_DATE_LOCALE, useValue: enAU },
    { provide: MAT_DATE_FORMATS, useValue: MAT_DATE_FNS_FORMATS },
    ...provideLoginContext(),
    ...authorizationInterceptorProviders(BASE_API_MATCHERS),
    BodyScrollbarHidingService,

    FileUploadService,
    ...uniModelServiceProviders(),
    ...labModelServiceProviders()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
