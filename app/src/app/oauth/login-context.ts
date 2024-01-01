import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { isBefore } from 'date-fns';
import { defer, firstValueFrom } from 'rxjs';
import { AccessTokenData, AccessTokenStore } from './access-token';
import { AbstractOauthFlow, OauthFlowFactory } from './flow/abstract-flow';
import { AuthorizationCodeFlowFactory } from './flows/authorization-code-flow';
import { RefreshTokenFlowFactory } from './flows/refresh-token-flow';
import { ResourceOwnerPasswordCredentialsFlowFactory } from './flows/resource-owner-password-flow';
import { OauthGrantType } from './oauth-grant-type';
import {
  NATIVE_OAUTH_PROVIDER,
  OauthProvider,
  OauthProviderContext,
  OauthProviderParams,
} from './oauth-provider';
import { OauthFlowStateStore } from './flow/flow-state-store.service';
import { injectRedirectToPublic, injectRedirectToUserHomePage } from './utils';

@Injectable({ providedIn: 'root' })
export class LoginContext {
  readonly router = inject(Router);

  readonly _oauthProviderContext = inject(OauthProviderContext);

  get currentProvider(): OauthProvider {
    return this._oauthProviderContext.current;
  }
  get currentProviderParams(): OauthProviderParams {
    return this._oauthProviderContext.currentParams;
  }

  readonly accessTokenStore = inject(AccessTokenStore);
  readonly accessTokenData$ = defer(() => this.accessTokenStore.tokenData$);

  get currentAccessTokenData(): AccessTokenData | null {
    return this.accessTokenStore.load();
  }

  get currentAccessToken(): string | null {
    return this.currentAccessTokenData?.accessToken || null;
  }

  readonly flowStateStore = inject(OauthFlowStateStore);

  isFlowInProgress(
    provider: OauthProvider | 'any',
    grantType: OauthGrantType | 'any'
  ) {
    return this.flowStateStore.isFlowInProgress(provider, grantType);
  }

  checkIsAnyFlowInProgress() {
    return this.flowStateStore.checkIsAnyFlowInProgress();
  }

  checkIsNoFlowInProgress() {
    return this.flowStateStore.checkIsNoFlowInProgress();
  }

  get isLoggedIn(): boolean {
    let accessTokenData = this.currentAccessTokenData;
    if (!accessTokenData) return false;

    let isExpired = isBefore(accessTokenData.expiresAt, new Date());
    return !!accessTokenData && !isExpired;
  }

  async checkLoggedIn(): Promise<boolean> {
    let accessTokenData = this.currentAccessTokenData;
    if (!accessTokenData) return false;

    let isExpired = isBefore(accessTokenData.expiresAt, new Date());
    if (isExpired && accessTokenData.refreshToken) {
      accessTokenData = await this._refreshToken(accessTokenData);
      isExpired = false;
    }
    return !!accessTokenData && !isExpired;
  }

  readonly redirectToHome = injectRedirectToUserHomePage();

  async finalizeFlow(
    grantType: OauthGrantType,
    params: unknown
  ): Promise<AccessTokenData> {
    const flow = this.getInProgressFlow(grantType);

    try {
      const accessTokenData = await flow.fetchToken(params);
      this.accessTokenStore.saveToken(accessTokenData);
      await this.redirectToHome();

      return accessTokenData;
    } catch (err) {
      console.error('Oauth flow finalized with error');
      throw err;
    } finally {
      this.flowStateStore.clearCurrentFlowState();
    }
  }

  readonly _flows: { [K in OauthGrantType]: OauthFlowFactory<K> } = {
    password: inject(ResourceOwnerPasswordCredentialsFlowFactory),
    authorization_code: inject(AuthorizationCodeFlowFactory),
    refresh_token: inject(RefreshTokenFlowFactory),
  };

  /**
   * @param grantType
   * @returns
   */
  getFlow<GrantType extends OauthGrantType>(
    grantType: GrantType
  ): AbstractOauthFlow<GrantType> {
    return this._flows[grantType].get(this.currentProviderParams);
  }

  async beginFlow<GrantType extends OauthGrantType>(
    grantType: GrantType,
    restoreRoute?: string
  ): Promise<AbstractOauthFlow<GrantType>> {
    this.checkIsNoFlowInProgress();

    const flow = this.getFlow(grantType);
    this.flowStateStore.initialize(
      await flow.generateInitialState({ restoreRoute })
    );

    flow.redirectToLogin();
    return flow;
  }

  getInProgressFlow<GrantType extends OauthGrantType>(
    grantType: GrantType
  ): AbstractOauthFlow<GrantType> {
    const flow = this.getFlow(grantType);
    if (!flow.isInProgress()) {
      throw new Error(`No '${grantType}' flow in progress`);
    }
    return flow;
  }

  async loginNativeUser(credentials: {
    username: string;
    password: string;
  }): Promise<AccessTokenData> {
    this._oauthProviderContext.setCurrent(NATIVE_OAUTH_PROVIDER);
    await this.beginFlow('password');
    return await this.finalizeFlow('password', credentials);
  }

  async loginExternalUser(provider: OauthProvider) {
    this._oauthProviderContext.setCurrent(provider);
    await this.beginFlow('authorization_code');
  }

  async handleExternalAuthorizationRedirect(params: unknown) {
    return await this.finalizeFlow('authorization_code', params);
  }

  async _refreshToken(accessToken: AccessTokenData) {
    if (this.currentProvider !== accessToken.provider) {
      throw new Error('Cannot refresh access token for different provider');
    }
    await this.beginFlow('refresh_token');
    return await this.finalizeFlow('refresh_token', accessToken);
  }

  logout(): Promise<void> {
    this._oauthProviderContext.clearCurrent();
    this.router.navigateByUrl('/public');
    return Promise.resolve();
  }
}
