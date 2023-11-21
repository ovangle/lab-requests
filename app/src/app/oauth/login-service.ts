import { APP_BASE_HREF, Location, PlatformLocation } from "@angular/common";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Inject, Injectable, InjectionToken, Injector, Provider, inject } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { add, differenceInSeconds, isBefore, parseISO } from "date-fns";
import { Subscription, catchError, firstValueFrom, map, of, timeout } from "rxjs";
import { LocalStorage } from "../utils/local-storage";
import { ExternalNavigation } from "../utils/router-utils";
import { NATIVE_OAUTH_PROVIDER, OauthProvider, OauthProviderContext, OauthProviderParams, OauthProviderRegistry } from "./oauth-provider";
import { AccessTokenData, AccessTokenStore, accessTokenDataFromAccessTokenResponse } from "./access-token";
import { OauthGrantType } from "./oauth-grant-type";
import { AbstractOauthFlow } from "./flows/abstract-oauth-flow";
import { ResourceOwnerPasswordCredentialsFlow } from "./flows/resource-owner-password-flow";
import { AuthorizationCodeFlow } from "./flows/authorization-code-flow";
import { RefreshTokenFlow } from "./flows/refresh-token-flow";

export class LoginError extends Error {
    readonly code: string;
    readonly description: string;

    constructor(code: string, description: string) {
        super(description);
        this.code = code;
        this.description = description;
    }
}

@Injectable({providedIn: 'root'})
export class LoginService {
    readonly router = inject(Router);

    readonly _oauthProviderContext = inject(OauthProviderContext);

    get currentProvider(): OauthProvider {
        return this._oauthProviderContext.current;
    }
    get currentProviderParams(): OauthProviderParams {
        return this._oauthProviderContext.currentParams
    }

    readonly _accessTokenStore = inject(AccessTokenStore);

    get currentAccessTokenData(): AccessTokenData | null {
        return this._accessTokenStore.load();
    }

    get currentAccessToken(): string | null {
        return this.currentAccessTokenData?.accessToken || null;
    }

    get isLoggedIn(): boolean {
        return this.currentAccessTokenData != null;
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

    /**
     * Begins a new login flow.
     * 
     * @param provider 
     * @param grantType 
     * @param restoreRoute 
     * @returns 
     * The url of the redirected user, or `null`
     */
    async _beginNewLoginFlow(
        provider: OauthProvider,
        grantType: OauthGrantType,  
        restoreRoute?: ActivatedRoute | null
    ): Promise<string | null> {
        const isLoggedIn = await this.checkLoggedIn();
        if (isLoggedIn) {
            throw new Error('Already logged in');
        }

        const flow = this.getFlow(grantType);
        await flow.init(provider);

        return flow.redirectToLogin();
    }

    async _finalizeCurrentLoginFlow(params: unknown) {
        const flow = this.getCurrentInProgressFlow();
        this._oauthProviderContext.setCurrent(flow.state.provider);

        const accessTokenData = await flow.fetchToken(params);
        this._accessTokenStore.saveToken(accessTokenData);
        await this._destroyCurrentLoginFlow();
        return accessTokenData;
    }

    async _destroyCurrentLoginFlow() {
        const flow = this.getCurrentInProgressFlow();
        this._oauthProviderContext.clearCurrent();
    }

    readonly _flows: {[K in OauthGrantType]: AbstractOauthFlow<any, any> } = {
        'password': inject(ResourceOwnerPasswordCredentialsFlow),
        'authorization_code': inject(AuthorizationCodeFlow),
        'refresh_token': inject(RefreshTokenFlow)
    };
    getFlow<Params>(grantType: OauthGrantType): AbstractOauthFlow<Params> {
        return this._flows[grantType];
    }
    getCurrentInProgressFlow<Params>(): AbstractOauthFlow<Params> {
        const provider = this.currentProvider;
        for (const flow of Object.values(this._flows)) {
            if (flow.isProviderFlowInProgress(provider)) {
                return flow;
            }
        }
        throw new Error('No flow currently in progress');
    }

    async loginNativeUser(credentials: {username: string; password: string; }) {
        await this._beginNewLoginFlow(NATIVE_OAUTH_PROVIDER, 'password');
        return await this._finalizeCurrentLoginFlow(credentials);
    }

    async loginExternalUser(provider: OauthProvider) {
        await this._beginNewLoginFlow(provider, 'authorization_code');
    }

    async handleExternalAuthorizationRedirect(content: {}) {
        const flow = this.getCurrentInProgressFlow();
        if (flow.grantType !== 'authorization_code') {
            throw new Error('No authorization code flow in progress');
        }

        return await this._finalizeCurrentLoginFlow(content);
    }

    async _refreshToken(accessToken: AccessTokenData) {
        await this._beginNewLoginFlow(accessToken.provider, 'refresh_token');
        return await this._finalizeCurrentLoginFlow(accessToken);
    }

    logout(): void {
        this._accessTokenStore.clearTokenData();
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