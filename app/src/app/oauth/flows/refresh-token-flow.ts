import { Injectable } from "@angular/core";
import { AccessTokenData, isAccessTokenData } from "../access-token";
import { OauthGrantRequest, OauthGrantType } from "../oauth-grant-type";
import { OauthProviderParams } from "../oauth-provider";
import { oauthScopeToQueryParam } from "../utils";
import { AbstractOauthFlow, OauthFlowEnv, OauthFlowFactory } from "../flow/abstract-flow";
import { OauthFlowState } from "../flow/flow-state-store.service";

export interface RefreshTokenGrant extends OauthGrantRequest<'refresh_token'> {
    token: AccessTokenData;
}

export class RefreshTokenFlow extends AbstractOauthFlow<'refresh_token', RefreshTokenGrant> {
    override readonly grantType: 'refresh_token' = 'refresh_token';

    override getGrantRequestBodyParams(request: RefreshTokenGrant): URLSearchParams {
        const currentToken = request.token;
        if (currentToken.refreshToken == null) {
            throw new Error('Unrefreshable token');
        }

        const params = new URLSearchParams();
        params.set('grant_type', this.grantType);
        params.set('client_id', currentToken.clientId);
        params.set('scope', oauthScopeToQueryParam(currentToken.scopes));
        params.set('refresh_token', currentToken.refreshToken);
        return params;
    }

    override generateInitialState() {
        return Promise.resolve(
            {provider: this.provider, grantType: this.grantType}
        );
    }

    override redirectToLogin(): string | null {
        return null;
    }

    override isValidGrantRequest(params: unknown): params is RefreshTokenGrant {
        return isAccessTokenData(params);
    }

}


@Injectable({providedIn: 'root'})
export class RefreshTokenFlowFactory extends OauthFlowFactory<'refresh_token'> {
    override readonly grantType = 'refresh_token';
    override get(provider: OauthProviderParams) {
        return new RefreshTokenFlow(this, provider);
    }
}
