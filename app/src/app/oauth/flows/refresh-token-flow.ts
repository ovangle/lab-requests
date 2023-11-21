import { Injectable } from "@angular/core";
import { AccessTokenData, isAccessTokenData } from "../access-token";
import { AbstractOauthFlow, OauthFlowStateParams, oauthFlowState } from "./abstract-oauth-flow";
import { oauthScopeToQueryParam } from "../utils";


@Injectable({providedIn: 'root'})
export class RefreshTokenFlow extends AbstractOauthFlow<AccessTokenData> {
    override readonly grantType = 'refresh_token';

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

    override _getInitialFlowState(provider: string): Promise<OauthFlowStateParams> {
        return Promise.resolve(oauthFlowState(this.grantType, provider, {}));
    }

    override redirectToLogin(): string | null {
        return null;
    }

    override isValidParams(params: unknown): params is AccessTokenData {
        return isAccessTokenData(params);
    }

}