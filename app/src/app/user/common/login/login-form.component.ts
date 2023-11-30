import { CommonModule } from "@angular/common";
import { Component, Input, Provider, TemplateRef, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { UserContext } from "../../user-context";
import { NativeUserCredentialsFormComponent } from "./native-user-credentials-form.component";
import { User } from "../user";
import { LoginService } from "src/app/oauth/login-service";
import { AccessTokenData } from "src/app/oauth/access-token";
import { Router } from "@angular/router";
import { OauthProvider } from "src/app/oauth/oauth-provider";


@Component({
    selector: 'user-login-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatInputModule,

        NativeUserCredentialsFormComponent
    ],
    template: `
    <user-native-user-credentials-form
        (login)="_onNativeUserLogin()"
    />

    <p>Alternatively, </p>

    <div id="supportedExternalProviders">
        <button mat-button (click)="_externalUserLoginRequest('microsoft-cqu')">Login via microsoft</button>
    </div>
    `
})
export class UserLoginFormComponent {
    readonly loginService = inject(LoginService);
    readonly router = inject(Router);

    _onNativeUserLogin() {
        this.router.navigateByUrl('/');
    }

    _externalUserLoginRequest(provider: OauthProvider) {
        this.loginService.loginExternalUser(provider);
    }
}