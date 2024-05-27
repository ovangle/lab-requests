import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import {
  logoutGuard,
  requiresAuthorizationGuard,
} from 'src/app/utils/router-utils';
import { AuthLoginPage } from './oauth-login.page';
import { AuthRedirectPage } from './oauth-redirect.page';
import { UserCredentialsFormComponent } from 'src/app/user/common/user-credentials-form.component';

@NgModule({ declarations: [AuthRedirectPage, AuthLoginPage], imports: [CommonModule,
        RouterModule.forChild([
            {
                path: 'redirect',
                component: AuthRedirectPage,
            },
            {
                path: 'login',
                component: AuthLoginPage,
            },
            {
                path: 'logout',
                canActivate: [logoutGuard],
                children: [],
            },
        ]),
        MatButtonModule,
        UserCredentialsFormComponent], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class OauthFeatureModule {}
