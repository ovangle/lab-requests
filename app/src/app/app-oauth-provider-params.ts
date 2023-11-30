import { Injectable, InjectionToken, inject, runInInjectionContext } from "@angular/core";
import { OAUTH_PROVIDER_PARAMS, OauthProviderParams } from "./oauth/oauth-provider";
import { API_BASE_URL } from "./common/model/model-service";
import { APP_BASE_HREF } from "@angular/common";

@Injectable({providedIn: 'root'})
export class AppOauthProviders {
    readonly apiBaseUrl = inject(API_BASE_URL);

    nativeProviderParams(): OauthProviderParams {
        return {
                provider: 'ovangle.com',
                authorizeUrl: `${this.apiBaseUrl}/oauth/authorize`,
                tokenUrl: `${this.apiBaseUrl}/oauth/token`,
                clientId: 'client-id',
                requiredScope: [
                    `${this.apiBaseUrl}/users/read`,
                    `${this.apiBaseUrl}/lab/read+write`,
                ]
        };
    }

    cquViaMicrosoftOauthProviderParams(): OauthProviderParams {
        const tenantId = 'unknown'
        const clientId = 'unknown';
        const requiredScope: string[] = [];

        const baseUrl = `https://login.microsoft.com/${tenantId}/oauth2/v2.0`;

        return {
            provider: 'microsoft-cqu',
            authorizeUrl: `${baseUrl}/authorize`,
            tokenUrl: `${baseUrl}/token`,
            clientId: clientId,
            requiredScope
        }
    }

    all(): OauthProviderParams[] {
        return [
            this.nativeProviderParams(),
            this.cquViaMicrosoftOauthProviderParams()
        ];
    }
}

export const APP_OAUTH_PROVIDER_PARAMS = new InjectionToken<OauthProviderParams[]>('APP_OAUTH_PROVIDER_PARAMS');

export function provideAppOauthProviderParams() {
    return {
        provide: APP_OAUTH_PROVIDER_PARAMS,
        useFactory: (paramsService: AppOauthProviders) => {
            return paramsService.all()
        },
        deps: [AppOauthProviders]
    };
}