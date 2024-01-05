import { Injectable } from '@angular/core';
import { isJsonObject } from 'src/app/utils/is-json-object';
import { OauthGrantRequest, OauthGrantType } from '../oauth-grant-type';
import { OauthProviderParams } from '../oauth-provider';
import { oauthScopeToQueryParam } from '../utils';
import {
  AbstractOauthFlow,
  OauthFlowEnv,
  OauthFlowFactory,
} from '../flow/abstract-flow';
import { OauthFlowState } from '../flow/flow-state-store.service';

export interface AuthorizationCodeGrantRequest
  extends OauthGrantRequest<'authorization_code'> {
  code: string;
  codeVerifier: string;
}
function isAuthorizationCodeGrantRequest(
  obj: unknown,
): obj is AuthorizationCodeGrantRequest {
  return (
    isJsonObject(obj) &&
    typeof obj['code'] === 'string' &&
    typeof obj['codeVerifier'] === 'string'
  );
}

export interface AuthorizationCodeFlowState
  extends OauthFlowState<'authorization_code'> {
  readonly stateToken: string;
  readonly stateTokenVerified?: boolean;
  readonly codeVerifier: string;
  readonly codeChallenge: string;
  readonly authCodeVerified?: boolean;
}

function markStateVerified(
  state: AuthorizationCodeFlowState,
): AuthorizationCodeFlowState {
  return { ...state, stateTokenVerified: true };
}

function verifyAuthCode(
  state: AuthorizationCodeFlowState,
): AuthorizationCodeFlowState {
  return { ...state, authCodeVerified: true };
}

export class AuthorizationCodeFlow extends AbstractOauthFlow<
  'authorization_code',
  AuthorizationCodeGrantRequest,
  AuthorizationCodeFlowState
> {
  override readonly grantType: 'authorization_code' = 'authorization_code';

  async generateInitialState() {
    const stateToken = generateStateToken();
    const codeVerifier = generateCodeVerifierToken();
    const codeChallenge = await getCodeChallenge(codeVerifier);

    return {
      provider: this.provider,
      grantType: this.grantType,
      stateToken,
      codeVerifier,
      codeChallenge,
    };
  }

  redirectToLogin() {
    const authUrlQueryParams = this.getAuthorizeQueryParams();
    const authUrl = `${this.providerParams.authorizeUrl}?${authUrlQueryParams}`;
    this.externalNavigation.go(authUrl);
    return authUrl;
  }

  getAuthorizeQueryParams(): URLSearchParams {
    const params = new URLSearchParams();
    params.set('client_id', this.providerParams.clientId);
    params.set('response_type', 'code');
    params.set('redirect_uri', this.redirectUrl);
    params.set(
      'scope',
      oauthScopeToQueryParam(this.providerParams.requiredScope),
    );
    params.set('state', this.state.stateToken);
    params.set('code_challenge_method', 'S256');
    params.set('code_challenge', this.state.codeChallenge);
    return params;
  }

  getGrantRequestBodyParams(params: AuthorizationCodeGrantRequest) {
    const request = new URLSearchParams();

    request.set('grant_type', 'authorization_code');
    request.set('client_id', this.providerParams.clientId);
    request.set(
      'scope',
      oauthScopeToQueryParam(this.providerParams.requiredScope),
    );
    request.set('code', params.code);
    request.set('code_verifier', params.codeVerifier);
    request.set('redirect_uri', this.redirectUrl);

    return request;
  }

  override isValidGrantRequest(
    obj: unknown,
  ): obj is AuthorizationCodeGrantRequest {
    return isAuthorizationCodeGrantRequest(obj);
  }
}

@Injectable({ providedIn: 'root' })
export class AuthorizationCodeFlowFactory extends OauthFlowFactory<'authorization_code'> {
  override readonly grantType = 'authorization_code';
  override get(provider: OauthProviderParams) {
    return new AuthorizationCodeFlow(this, provider);
  }
}

const chars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890-._~' as const;

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

function generateCodeVerifierToken() {
  return generateRandomToken(128);
}

async function getCodeChallenge(verifierToken: string): Promise<string> {
  const tokenBytes = new TextEncoder().encode(verifierToken);
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', tokenBytes),
  );
  return btoa(String.fromCharCode(...digest))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}
