import { Component, OnInit, inject } from "@angular/core";
import { LoginContext } from "../login-context";
import { LoginRequest } from "src/app/user/login/native-user-login-form.component";
import { InvalidCredentials } from "../loigin-error";


@Component({
    selector: 'oauth-login-page',
    template: `
    <user-native-user-credentials-form 
        (loginRequest)="_onSubmitNativeLoginRequest($event)">
    </user-native-user-credentials-form>
    
    <div id="supportedExternalProviders">
        <button mat-button 
                (click)="_onClickExternalProviderLogin('microsoft-cqu')">
            Login via CQU
        </button>
    </div>
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

    async _onSubmitNativeLoginRequest(credentials: LoginRequest) {
        try {
            const accessTokenData = await this.loginContext.loginNativeUser({
                username: credentials.email,
                password: credentials.password
            });
            credentials.setResultSuccess({accessToken: accessTokenData.accessToken})
        } catch (err) {
            if (err instanceof InvalidCredentials) {
                return credentials.setResultError({invalidCredentials: err.errorDescription})
            }
            throw err;
        }
    }

    async _onClickExternalProviderLogin(provider: string) { 
        return await this.loginContext.loginExternalUser(provider)
    }
}