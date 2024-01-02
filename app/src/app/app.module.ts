import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  MAT_DATE_FNS_FORMATS,
  MatDateFnsModule,
} from '@angular/material-date-fns-adapter';
import { enAU } from 'date-fns/locale';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { provideLocalStorage } from './utils/local-storage';
import { PlatformLocation } from '@angular/common';
import {
  AUTHORIZED_API_URL_MATCHER,
  baseUrlMatcherFn,
} from './oauth/_root/auth-interceptor';
import { MatButtonModule } from '@angular/material/button';
import { BodyScrollbarHidingService } from './utils/body-scrollbar-hiding.service';
import { uniModelServiceProviders } from './uni/uni';
import { FileUploadService } from './common/file/file-upload.service';
import { API_BASE_URL } from './common/model/model-service';
import { OauthRootModule } from './oauth/_root/oauth.root-module';
import {
  APP_OAUTH_PROVIDER_PARAMS,
  provideAppOauthProviderParams,
} from './app-oauth-provider-params';
import { ScaffoldLayoutComponent } from './scaffold/scaffold-layout.component';
import { provideSidenavMenuRootGroupControl } from './scaffold/sidenav-menu/sidenav-menu-group-control';
import { LabSidenavMenuGroupControl } from './lab/_root/lab-sidenav-menu-group-control';

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
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,

    MatButtonModule,
    MatDateFnsModule,
    OauthRootModule.forRoot(
      {
        publicPage: '/public',
        oauthFeature: '/oauth',
        defaultUserHomePage: '/user/home',
      },
      APP_OAUTH_PROVIDER_PARAMS
    ),
    ScaffoldLayoutComponent,
  ],
  providers: [
    {
      provide: API_BASE_URL,
      useValue: '/api',
    },
    ...provideLocalStorage(),
    { provide: MAT_DATE_LOCALE, useValue: enAU },
    { provide: MAT_DATE_FORMATS, useValue: MAT_DATE_FNS_FORMATS },
    BodyScrollbarHidingService,

    {
      provide: AUTHORIZED_API_URL_MATCHER,
      multi: true,
      useFactory: (apiBaseUrl: string) =>
        baseUrlMatcherFn(apiBaseUrl, ['/oauth/token']),
      deps: [API_BASE_URL],
    },
    provideAppOauthProviderParams(),

    FileUploadService,
    ...uniModelServiceProviders(),

    provideSidenavMenuRootGroupControl(LabSidenavMenuGroupControl),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
