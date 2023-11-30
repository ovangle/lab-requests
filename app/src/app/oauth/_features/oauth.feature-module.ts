import { InjectionToken, ModuleWithProviders, NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AuthRedirectPageComponent } from "./oauth-redirect.page";
import urlJoin from "url-join";
import { OAUTH_FEATURE_PATH, PUBLIC_PAGE_PATH } from "../utils";
import { OAUTH_PROVIDER_PARAMS, OauthProviderParams } from "../oauth-provider";

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: 'redirect',
                component: AuthRedirectPageComponent
            }
        ])
    ],
})
export class OauthFeatureModule {
    static forRoot(routes: {
            publicPage: string;
            oauthFeature: string;
        }, 
        providerParams: OauthProviderParams[] | InjectionToken<OauthProviderParams[]>
    ): ModuleWithProviders<OauthFeatureModule> {
        const paramsProvider = Array.isArray(providerParams)
            ? { provide: OAUTH_PROVIDER_PARAMS, useValue: providerParams}
            : { provide: OAUTH_PROVIDER_PARAMS, useExisting: providerParams }

        return {
            ngModule: OauthFeatureModule,
            providers: [
                paramsProvider,
                { provide: PUBLIC_PAGE_PATH, useValue: routes.publicPage},
                { provide: OAUTH_FEATURE_PATH, useValue: routes.oauthFeature}
            ]
        }
    }
}
