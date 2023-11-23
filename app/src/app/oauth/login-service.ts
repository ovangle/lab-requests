import { APP_BASE_HREF, Location, PlatformLocation } from "@angular/common";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Inject, Injectable, InjectionToken, Injector, Provider, inject } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { add, differenceInSeconds, isBefore, parseISO } from "date-fns";
import { Subscription, catchError, firstValueFrom, map, of, timeout } from "rxjs";
import { LocalStorage } from "../utils/local-storage";
import { ExternalNavigation } from "../utils/router-utils";
import { NATIVE_OAUTH_PROVIDER, OauthProvider, OauthProviderContext, OauthProviderParams, OauthProviderRegistry } from "./oauth-provider";
import { AccessTokenData, AccessTokenStore, accessTokenResponseToAccessTokenData } from "./access-token";
import { OauthGrantType } from "./oauth-grant-type";
import { AUTH_REDIRECT_URL, AbstractOauthFlow, OauthFlowEnv, OauthFlowFactory, OauthFlowStateStore } from "./flows/abstract-oauth-flow";
import { ResourceOwnerPasswordCredentialsFlow, ResourceOwnerPasswordCredentialsFlowFactory } from "./flows/resource-owner-password-flow";
import { AuthorizationCodeFlow, AuthorizationCodeFlowFactory } from "./flows/authorization-code-flow";
import { RefreshTokenFlow, RefreshTokenFlowFactory } from "./flows/refresh-token-flow";
import { injectModelQuery } from "../common/model/model-collection";
import { InvalidCredentials } from "./loigin-error";


@Injectable({providedIn: 'root'})
export class LoginService implements OauthFlowEnv {
    readonly router = inject(Router);
    readonly externalNavigation = inject(ExternalNavigation);
    readonly httpClient = inject(HttpClient);

    readonly _oauthProviderContext = inject(OauthProviderContext);

    readonly authorizationRedirectUrl = inject(AUTH_REDIRECT_URL);

    get currentProvider(): OauthProvider {
        return this._oauthProviderContext.current;
    }
    get currentProviderParams(): OauthProviderParams {
        return this._oauthProviderContext.currentParams
    }

    readonly accessTokenStore = inject(AccessTokenStore);

    get currentAccessTokenData(): AccessTokenData | null {
        return this.accessTokenStore.load();
    }

    get currentAccessToken(): string | null {
        return this.currentAccessTokenData?.accessToken || null;
    }

    get isLoggedIn(): boolean {
        return this.currentAccessTokenData != null;
    }

    readonly flowStateStore = inject(OauthFlowStateStore);

    isFlowInProgress(provider: OauthProvider | 'any', grantType: OauthGrantType | 'any') {
        return this.flowStateStore.isFlowInProgress(provider, grantType);
    }

    checkIsAnyFlowInProgress() {
        return this.flowStateStore.checkIsAnyFlowInProgress();
    }

    checkIsNoFlowInProgress() {
        return this.flowStateStore.checkIsNoFlowInProgress();
    }

    async checkLoggedIn(): Promise<boolean> {
        let accessTokenData = this.currentAccessTokenData;
        if (!accessTokenData) return false;

        let isExpired = isBefore(accessTokenData.expiresAt, new Date())
        if (isExpired && accessTokenData.refreshToken) {
            const refreshedToken = await this._refreshToken(accessTokenData);
            accessTokenData = this.currentAccessTokenData;
            isExpired = false;
        }
        return !!accessTokenData && !isExpired;
    }

    async finalizeFlow(grantType: OauthGrantType, params: unknown) {
        const flow = this.getInProgressFlow(grantType);

        try {
            const accessTokenData = await flow.fetchToken(params);
            this.accessTokenStore.saveToken(accessTokenData);
            return accessTokenData;
        } finally {
            this.flowStateStore.clearCurrentFlowState()
        }
    }

    readonly _flows: {[K in OauthGrantType]: OauthFlowFactory } = {
        'password': inject(ResourceOwnerPasswordCredentialsFlowFactory),
        'authorization_code': inject(AuthorizationCodeFlowFactory),
        'refresh_token': inject(RefreshTokenFlowFactory)
    };

    /**
     * @param grantType 
     * @returns 
     */
    getFlow(grantType: OauthGrantType): AbstractOauthFlow<unknown> {
        return this._flows[grantType].get(this, this.currentProviderParams);
    }

    async beginFlow(grantType: OauthGrantType): Promise<AbstractOauthFlow<unknown>> {
        this.checkIsNoFlowInProgress();

        const flow = this.getFlow(grantType);
        this.flowStateStore.initialize(await flow.generateInitialFlowState());

        return flow;
    }

    getInProgressFlow(grantType: OauthGrantType): AbstractOauthFlow<unknown> {
        const flow = this.getFlow(grantType);
        if (!flow.isInProgress()) {
            throw new Error('No flow in progress');
        }
        return flow;
    }

    async loginNativeUser(credentials: {username: string; password: string; }) {
        this._oauthProviderContext.setCurrent(NATIVE_OAUTH_PROVIDER);
        return await this.finalizeFlow('password', credentials);
    }

    async loginExternalUser(provider: OauthProvider) {
        this._oauthProviderContext.setCurrent(provider);
        await this.beginFlow('authorization_code');
    }

    async handleExternalAuthorizationRedirect(params: unknown) {
        const flow = this.getInProgressFlow('authorization_code');
        return await this.finalizeFlow('authorization_code', params);
    }

    async _refreshToken(accessToken: AccessTokenData) {
        if (this.currentProvider !== accessToken.provider) {
            throw new Error('Cannot refresh access token for different provider');
        }
        await this.beginFlow('refresh_token');
        return await this.finalizeFlow('refresh_token', accessToken);
    }

    logout(): void {
        this.accessTokenStore.clearTokenData();
        this._oauthProviderContext.clearCurrent();
        this.router.navigateByUrl('/public');
    }

    /**
     * TODO: Restore the current page on re-login
    saveRestoreRoute(routeToRestore: ActivatedRoute | null | undefined) {
        if (routeToRestore != null) {
            const routeUrlToRestore = this.router.createUrlTree(['.'], {relativeTo: routeToRestore});
            this.localStorage.setItem(OAUTH_RESTORE_ROUTE_KEY, this.router.serializeUrl(routeUrlToRestore));
        } else {
            this.localStorage.removeItem(OAUTH_RESTORE_ROUTE_KEY);
        }
    }
    restorePreviousRoute(): void {
        const routeUrlToRestore = this.localStorage.getItem(OAUTH_RESTORE_ROUTE_KEY) || '/';
        this.router.navigateByUrl(routeUrlToRestore);
    }
    clearRestoreRoute() {
        this.localStorage.removeItem(OAUTH_RESTORE_ROUTE_KEY);
    }
    */
}
