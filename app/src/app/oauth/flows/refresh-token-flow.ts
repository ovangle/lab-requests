import { Injectable } from "@angular/core";
import { AccessTokenData, isAccessTokenData } from "../access-token";
import { OauthGrantType } from "../oauth-grant-type";
import { OauthProviderParams } from "../oauth-provider";
import { oauthScopeToQueryParam } from "../utils";
import { AbstractOauthFlow, OauthFlowEnv, OauthFlowFactory } from "./abstract-oauth-flow";


export class RefreshTokenFlow extends AbstractOauthFlow<AccessTokenData> {
    override readonly grantType: OauthGrantType = 'refresh_token';

    override requestToUrlSearchParams(currentToken: AccessTokenData): URLSearchParams {
        if (currentToken.refreshToken == null) {
            throw new Error('Unrefreshable token');
        }

        const params = new URLSearchParams();
        params.set('grant_type', this.grantType);
        params.set('client_id', currentToken.clientId);
        params.set('scope', oauthScopeToQueryParam(currentToken.scope));
        params.set('refresh_token', currentToken.refreshToken);
        return params;
    }

    override generateInitialFlowState() {
        return Promise.resolve(
            {provider: this.provider, grantType: this.grantType}
        );
    }

    override redirectToLogin(): string | null {
        return null;
    }

    override isValidTokenParams(params: unknown): params is AccessTokenData {
        return isAccessTokenData(params);
    }

}


@Injectable({providedIn: 'root'})
export class RefreshTokenFlowFactory extends OauthFlowFactory {
    override readonly grantType: OauthGrantType = 'refresh_token';
    override get(env: OauthFlowEnv, provider: OauthProviderParams) {
        return new RefreshTokenFlow(env, provider);
    }
}
