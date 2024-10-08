import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

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
import { APP_BASE_HREF, PlatformLocation } from '@angular/common';
import {
  AUTHORIZED_API_URL_MATCHER,
  baseUrlMatcherFn,
} from './oauth/_root/auth-interceptor';
import { MatButtonModule } from '@angular/material/button';
import { BodyScrollbarHidingService } from './utils/body-scrollbar-hiding.service';
import { FileUploadService } from './common/file/file-upload.service';
import { API_BASE_URL } from './common/model/model-service';
import { OauthRootModule } from './oauth/_root/oauth.root-module';
import {
  APP_OAUTH_PROVIDER_PARAMS,
  provideAppOauthProviderParams,
} from './app-oauth-provider-params';
import { ScaffoldLayoutComponent } from './scaffold/scaffold-layout.component';
import { provideAppBaseUrl } from './utils/app-base-url';

@NgModule({ declarations: [AppComponent],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatButtonModule,
        MatDateFnsModule,
        OauthRootModule.forRoot({
            publicPage: '/public',
            oauthFeature: '/oauth',
            defaultUserHomePage: '/user/home',
        }, APP_OAUTH_PROVIDER_PARAMS),
        ScaffoldLayoutComponent], providers: [
        {
            provide: APP_BASE_HREF,
            useFactory: (s: PlatformLocation) => s.getBaseHrefFromDOM(),
            deps: [PlatformLocation]
        },
        provideAppBaseUrl(),
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
            useFactory: (apiBaseUrl: string) => baseUrlMatcherFn(apiBaseUrl, ['/oauth/token']),
            deps: [API_BASE_URL],
        },
        provideAppOauthProviderParams(),
        FileUploadService,
        provideHttpClient(withInterceptorsFromDi()),
    ] })
export class AppModule { }
