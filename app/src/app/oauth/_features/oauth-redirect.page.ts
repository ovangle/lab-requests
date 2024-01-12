import { Component, inject } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LoginContext } from '../login-context';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { InvalidCredentials } from '../loigin-error';

@Component({
  selector: 'lab-req-auth-redirect-page',
  template: `
    @if (!error) {
      <p>Redirecting...</p>
    } @else {
      <div class="error-info">
        <h2>An error occurred: ({{ error }})</h2>

        <p>{{ errorDescription }}</p>
      </div>

      <!--
            <button mat-button (click)="clearLoginState()">Reset app state</button>
        -->
      <a mat-button routerLink="/">Return home</a>
    }
  `,
  styles: [
    `
      .error-info {
        margin-left: 1em;
        max-width: 1000px;
      }
    `,
  ],
})
export class AuthRedirectPage {
  readonly _loginService = inject(LoginContext);
  readonly activatedRoute = inject(ActivatedRoute);

  error: string | null = null;
  errorDescription: string | null = null;

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(async (params) => {
      if (Object.keys(params).includes('error')) {
        this.error = params[ 'error' ];
        this.errorDescription = params[ 'error_description' ];
        console.log('Oauth returned error:', params[ 'error' ]);
        console.log('Description\n\n', params[ 'error_description' ]);
        return;
      }
      const authCode = params[ 'code' ];
      const stateToken = params[ 'state' ];

      try {
        await this._loginService.handleExternalAuthorizationRedirect({
          authCode,
          stateToken,
        });
      } catch (err) {
        if (err instanceof InvalidCredentials) {
          this.error = err.error;
          this.errorDescription = err.errorDescription;
        }
        throw err;
      }
    });
  }
}
