import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DATE_FNS_FORMATS, MatDateFnsModule } from '@angular/material-date-fns-adapter';
import { enAU } from 'date-fns/locale';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { LocalizedString } from '@angular/compiler';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,

    MatDateFnsModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: enAU },
    { provide: MAT_DATE_FORMATS, useValue: MAT_DATE_FNS_FORMATS }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
