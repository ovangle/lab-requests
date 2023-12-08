import { Component, OnInit, inject } from "@angular/core";
import { LoginContext } from "../login-context";
import { InvalidCredentials } from "../loigin-error";
import { LoginRequest } from "src/app/user/common/user-credentials-form.component";


@Component({
    selector: 'oauth-login-page',
    template: `
    <div>
        <user-credentials-form 
            (loginRequest)="_onSubmitNativeLoginRequest($event)" />
        <div id="supportedExternalProviders">
            <h4>Alternatively, you can</h4>

            <button mat-button disabled
                    (click)="_onClickExternalProviderLogin('microsoft-cqu')">
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

    `
})
export class AuthLoginPage implements OnInit {
    readonly loginContext = inject(LoginContext);

    ngOnInit() {
        if (this.loginContext.isLoggedIn) {
            // Can't navigate to a login page when already logged in.
            throw new Error('Already logged in!');
        }
    }

    async _onSubmitNativeLoginRequest(loginRequest: LoginRequest) {
        try {
            const accessTokenData = await this.loginContext.loginNativeUser({
                username: loginRequest.email,
                password: loginRequest.password
            });
            loginRequest.setResultSuccess({accessToken: accessTokenData.accessToken})
        } catch (err) {
            if (err instanceof InvalidCredentials) {
                return loginRequest.setResultError({invalidCredentials: err.errorDescription})
            }
            throw err;
        }
    }

    async _onClickExternalProviderLogin(provider: string) { 
        return await this.loginContext.loginExternalUser(provider)
    }
}