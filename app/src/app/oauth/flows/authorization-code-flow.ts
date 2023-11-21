import { Injectable, inject } from "@angular/core";
import { AbstractOauthFlow, OauthFlowState, OauthFlowStateStore } from "./abstract-oauth-flow";
import { OauthProvider, isOauthProvider } from "../oauth-provider";
import { isJsonObject } from "src/app/utils/is-json-object";
import { ExternalNavigation } from "src/app/utils/router-utils";

export interface AuthorizationCodeGrantRequest {
    code: string;
    codeVerifier: string;
}
function isAuthorizationCodeGrantRequest(obj: unknown): obj is AuthorizationCodeGrantRequest {
    return isJsonObject(obj)
        && typeof obj['code'] === 'string'
        && typeof obj['codeVerifier'] === 'string';
}

export interface AuthorizationCodeFlowState extends OauthFlowState {
    readonly stateToken: string;
    readonly stateTokenVerified?: boolean;
    readonly codeVerifier: string;
    readonly codeChallenge: string;
    readonly authCodeVerified?: boolean;
}

function markStateVerified(state: AuthorizationCodeFlowState): AuthorizationCodeFlowState {
    return {...state ,stateTokenVerified: true};
}

function verifyAuthCode(state: AuthorizationCodeFlowState, ): AuthorizationCodeFlowState {
    return {...state, authCodeVerified: true}
}


@Injectable({providedIn: 'root'})
export class AuthorizationCodeFlow extends AbstractOauthFlow<AuthorizationCodeGrantRequest, AuthorizationCodeFlowState> {
    readonly grantType = 'authorization_code';
    readonly _externalNavigation = inject(ExternalNavigation);

    async _getInitialFlowState(provider: OauthProvider) {
        const stateToken = generateStateToken();
        const codeVerifier = generateCodeVerifierToken();
        const codeChallenge = await getCodeChallenge(codeVerifier);

        return { provider, stateToken, codeVerifier, codeChallenge };
    }

    redirectToLogin() {
        const providerParams = this.oauthProviderParams;

        const authUrlQueryParams = this.getAuthorizeQueryParams()
        const authUrl = `${providerParams.authorizeUrl}?${authUrlQueryParams}`;
        this._externalNavigation.go(authUrl);
        return authUrl;
    }

    getAuthorizeQueryParams(): URLSearchParams {
        const providerParams = this.oauthProviderParams;

        const params = new URLSearchParams();
        params.set('client_id', providerParams.clientId);
        params.set('response_type', 'code');
        params.set('redirect_uri', this.authorizationRedirectUrl);
        params.set('scope', this.requiredScope);
        params.set('state', this.state.stateToken);
        params.set('code_challenge_method', 'S256');
        params.set('code_challenge', this.state.codeChallenge);
        return params;
    }

    requestToUrlSearchParams(params: AuthorizationCodeGrantRequest) {
        const request = new URLSearchParams();
        
        request.set('grant_type', 'authorization_code');
        request.set('client_id', this.oauthProviderParams.clientId);
        request.set('scope', this.requiredScope);
        request.set('code', params.code);
        request.set('code_verifier', params.codeVerifier);
        request.set('redirect_uri', this.authorizationRedirectUrl);

        return request;
    }

    override isValidParams(obj: unknown): obj is AuthorizationCodeGrantRequest {
        return isAuthorizationCodeGrantRequest(obj); 
    }

}


const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890-._~" as const;

function generateRandomToken(length: number): string {
    const arr = new Uint8Array(length);
    crypto.getRandomValues(arr);

    const tokenChars = Array.from(arr).map((item) => chars[item % chars.length]);
    return tokenChars.join('');
}

function generateStateToken(): string {
    return btoa(generateRandomToken(10))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function verifyStateToken(expectedValue: string, receivedValue: string): {[k: string]: string} | null {
    if (expectedValue !== receivedValue) {
        return {invalidState: `Received invalid state token ${receivedValue} in response`}
    }
    return null;
}

function generateCodeVerifierToken() {
    return generateRandomToken(128);
}

async function getCodeChallenge(verifierToken: string): Promise<string> {
    const tokenBytes = new TextEncoder().encode(verifierToken);
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", tokenBytes));
    return btoa(String.fromCharCode(...digest))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
}