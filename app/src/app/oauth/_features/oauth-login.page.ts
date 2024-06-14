import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { LoginContext } from '../login-context';
import { InvalidCredentials } from '../loigin-error';
import { LoginRequest } from 'src/app/user/common/user-credentials-form.component';
import { bindCallback } from 'rxjs';
import { ScaffoldStateService } from 'src/app/scaffold/scaffold-state.service';

@Component({
  selector: 'oauth-login-page',
  template: `
    <div>
      <user-credentials-form
        (loginRequest)="_onSubmitNativeLoginRequest($event)"
      />
      <div id="supportedExternalProviders">
        <h4>Alternatively, you can</h4>

        <button
          mat-button
          disabled
          (click)="_onClickExternalProviderLogin('microsoft-cqu')"
        >
          Login via CQU (not working)
        </button>
      </div>
    </div>
  `,
  styles: `
    :host {
        display: flex;
        flex-direction: column;
        height: 100%;

        align-items: center;
        justify-content: center;
    }

    user-native-user-credentials-form {
        display: block;
        margin-bottom: 2em;
    }

    `,
})
export class AuthLoginPage implements OnInit {
  readonly scaffold = inject(ScaffoldStateService);
  readonly loginContext = inject(LoginContext);

  readonly _destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.loginContext
      .checkLoggedIn()
      .then((isLoggedIn) => {
        if (isLoggedIn) {
          return this.loginContext.redirectToHome();
        }
        return null;
      })
      .then(() => {
        this.scaffold.disableLoginButton(this._destroyRef);
      });
  }

  async _onSubmitNativeLoginRequest(loginRequest: LoginRequest) {
    try {
      const accessTokenData = await this.loginContext.loginNativeUser({
        username: loginRequest.email,
        password: loginRequest.password,
      });
      loginRequest.setResultSuccess({
        accessToken: accessTokenData.accessToken,
      });
    } catch (err) {
      if (err instanceof InvalidCredentials) {
        return loginRequest.setResultError({ invalidCredentials: true });
      }
      throw err;
    }
  }

  async _onClickExternalProviderLogin(provider: string) {
    return await this.loginContext.loginExternalUser(provider);
  }
}
