import { InjectionToken, ModuleWithProviders, NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AuthRedirectPage } from "./oauth-redirect.page";
import urlJoin from "url-join";
import { OAUTH_FEATURE_PATH, PUBLIC_PAGE_PATH } from "../utils";
import { OAUTH_PROVIDER_PARAMS, OauthProviderParams } from "../oauth-provider";
import { NativeUserCredentialsFormComponent } from "src/app/user/login/native-user-login-form.component";
import { CommonModule } from "@angular/common";
import { AuthLoginPage } from "./oauth-login.page";
import { HttpClientModule } from "@angular/common/http";
import { MatButtonModule } from "@angular/material/button";

@NgModule({
    imports: [
        CommonModule,
        HttpClientModule,
        RouterModule.forChild([
            {
                path: 'redirect',
                component: AuthRedirectPage
            },
            {
                path: 'login',
                component: AuthLoginPage
            }
        ]),

        MatButtonModule,

        NativeUserCredentialsFormComponent
    ],
    declarations: [
        AuthRedirectPage,
        AuthLoginPage
    ]
})
export class OauthFeatureModule {
    
}
