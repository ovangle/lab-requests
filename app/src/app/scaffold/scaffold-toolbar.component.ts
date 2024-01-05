import { Component, DestroyRef, Injectable, inject } from '@angular/core';
import { LoginContext } from '../oauth/login-context';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UserMenuComponent } from '../user/common/user-menu.component';
import { AppRoutes } from '../app-routing.module';

import { ScaffoldStateService } from './scaffold-state.service';

@Component({
  selector: 'scaffold-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    MatToolbarModule,
    MatButtonModule,

    UserMenuComponent,
  ],
  template: `
    <mat-toolbar>
      <div class="logo">
        <img width="30" alt="Logo" src="/assets/android-chrome-192x192.png" />
      </div>

      @if (scaffoldState.title$ | async; as title) {
        <div class="title">
          {{ title }}
        </div>
      }

      <div class="spacer"></div>

      <user-menu
        [userFeatureLink]="[_appRoutes.user]"
        [isLoggedIn]="_oauthContext.isLoggedIn"
        [loginDisabled]="scaffoldState.isLoginButtonDisabled$ | async"
        userFullName="Current user"
      />
    </mat-toolbar>
  `,
  styles: `
    :host {
        display: flex;
        align-items: center;
        box-sizing: border-box;
    }

    .logo {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .title {
        padding-left: 1em;
    }

    .spacer {
        flex: 1 0;
    }

    `,
})
export class ToolbarComponent {
  _appRoutes = inject(AppRoutes);
  _oauthContext = inject(LoginContext);
  _activatedRoute = inject(ActivatedRoute);

  readonly scaffoldState = inject(ScaffoldStateService);
}
