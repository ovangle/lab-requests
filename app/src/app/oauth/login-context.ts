import { APP_BASE_HREF, Location, PlatformLocation } from "@angular/common";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Inject, Injectable, InjectionToken, Provider } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { add, differenceInSeconds, isBefore, parseISO } from "date-fns";
import { Subscription, catchError, firstValueFrom, map, of, timeout } from "rxjs";
import { LocalStorage } from "../utils/local-storage";
import { ExternalNavigation } from "../utils/router-utils";

const OAUTH_CURRENT_PROVIDER_KEY = 'oauthCurrentProvider';
const OAUTH_STATE_TOKEN_KEY = 'oauthStateToken';
const OAUTH_CODE_VERIFIER_KEY = 'oauthCodeVerifier';

const OAUTH_ACCESS_TOKEN_STORAGE_KEY = 'oauthAccessToken';
const OAUTH_ACCESS_TOKEN_EXPIRES_AT_KEY = 'oauthAccessTokenExpiresAt';
const OAUTH_REFRESH_TOKEN_STORAGE_KEY = 'oauthRefreshToken';

const OAUTH_RESTORE_ROUTE_KEY = 'oauthRestoreRoute';

type OauthProvider = 'microsoft';

interface OauthParams {
    readonly provider: OauthProvider;
    authorizeUrl: string;
    tokenUrl: string;
    clientId: string;
    requiredScope: string[];
}

interface MicrosoftOauthParams {
    readonly provider: 'microsoft';
    readonly tenantId: 'common' | 'organizations' | string /* uuid */;
    readonly clientId: string;
    readonly requiredScope: string[];
}

function msOauthParamsAsOauthParams(msOauthParams: MicrosoftOauthParams): OauthParams {
    return {
        provider: msOauthParams.provider,
        authorizeUrl: `https://login.microsoft.com/${msOauthParams.tenantId}/oauth2/v2.0/authorize`,
        tokenUrl: `https://login.microsoft.com/${msOauthParams.tenantId}/oauth2/v2.0/token`,
        clientId: msOauthParams.clientId,
        requiredScope: msOauthParams.requiredScope
    };
}

const OAUTH_PARAMS = new InjectionToken<OauthParams>('MS_OAUTH_PARAMS');

export function provideLoginContext(): Provider[] {
    return [
        {
            provide: OAUTH_PARAMS,
            useValue: msOauthParamsAsOauthParams({
                provider: 'microsoft',
                tenantId: '3caa9ec8-40fb-44d2-bcc1-0bd4f2f47bec',
                clientId: '7d6b1a60-1f68-4df8-85ca-45c8d3d5e31c',
                requiredScope: [
                    'https://graph.microsoft.com/User.Read'
                ]
            }),
            multi: true
        },
        LoginContext
    ]
}

interface AccessTokenResponse {
    readonly access_token: string;
    readonly expires_in: number;
    readonly refresh_token: string | null;
}

export function isAccessTokenResponse(obj: any): obj is AccessTokenResponse {
    return Object.keys(obj).includes('access_token');
}

interface AccessTokenErrorResponse {
    readonly error: string;
    readonly error_description: string;
}

interface AccessTokenData {
    readonly provider: OauthProvider;
    readonly accessToken: string;
    readonly expiresAt: Date;
    readonly refreshToken: string | null;
}

function fromAccessTokenResponse(provider: OauthProvider, response: AccessTokenResponse): AccessTokenData {
    return {
        provider,
        accessToken: response.access_token,
        expiresAt: add(new Date(), { seconds: response.expires_in}),
        refreshToken: response.refresh_token
    };
}

interface User {
    email: string;
}

@Injectable()
export class LoginContext {
    constructor(
        readonly platformLocation: PlatformLocation,
        readonly location: Location,
        readonly router: Router,
        readonly externalNavigation: ExternalNavigation,
        readonly httpClient: HttpClient,

        readonly localStorage: LocalStorage,

        @Inject(OAUTH_PARAMS) readonly oauthParams: OauthParams[]
    ) {}

    get authorizeRedirectUri(): string {
        let isDefaultPortForProtocol = false;
        switch (this.platformLocation.protocol) {
            case 'http:':
                isDefaultPortForProtocol = (this.platformLocation.port === '80');
                break;
            case 'https:':
                isDefaultPortForProtocol = (this.platformLocation.port === '443');
                break;
        }

        const host = this.platformLocation.hostname + (
            isDefaultPortForProtocol ? '' : `:${this.platformLocation.port}`
        );

        const baseUrl = `${this.platformLocation.protocol}//${host}`
        return baseUrl + this.location.prepareExternalUrl('/sso-redirect');
    }

    get currentProvider(): OauthProvider | null {
        return this._currentProviderParams?.provider || null;
    }
    get currentProviderParams(): OauthParams | null {
        if (this._currentProviderParams === undefined) {
            throw new Error('Login context uninitialized');
        }
        return this._currentProviderParams;
    }
    private _setCurrentProvider(value: OauthProvider | null, init=false) {
        if (value == this.currentProvider) {
            return;
        }
        if (!init) {
            this.clearLocalStorage();
        }
        this._currentAccessTokenData = null;
        // this._currentUser = null;

        if (value != null) {
            const valueParams = this.oauthParams
                .filter(params => params.provider == value)[0];

            if (valueParams === undefined) {
                throw new Error(`No params found for provider '${value}'`);
            }
            this.localStorage.setItem(OAUTH_CURRENT_PROVIDER_KEY, value);
            this._currentProviderParams = valueParams;
        } else {
            this.localStorage.removeItem(OAUTH_CURRENT_PROVIDER_KEY);
            this._currentProviderParams = null;
        }
    }
    _currentProviderParams: OauthParams | null | undefined;

    get isInitialized() {
        return this._currentProviderParams !== undefined;
    }

    get currentAccessToken(): string | null {
        return this.currentAccessTokenData?.accessToken || null;
    }

    get currentAccessTokenData(): AccessTokenData | null {
        return this._currentAccessTokenData;
    }
    _currentAccessTokenData: AccessTokenData | null;

    //  get currentUser(): User | null {
    //     return this._currentUser;
    // }
    // _currentUser: User | null;

    get isLoggedIn(): boolean {
        return this._currentAccessTokenData != null;
    }

    async checkLoggedIn(): Promise<boolean> {
        let accessTokenData = this.currentAccessTokenData;
        if (!accessTokenData) return false;

        let isExpired = isBefore(accessTokenData.expiresAt, new Date())
        if (isExpired && accessTokenData.refreshToken) {
            await this.refreshTokenGrant();
            accessTokenData = this.currentAccessTokenData;
            isExpired = false;
        }
        return !!accessTokenData && !isExpired;
    }

    async init(options?: {
        clear?: boolean
    }) {
        const isClearContext = !!(options && options.clear);
        if (isClearContext) {
            this.clearLocalStorage();
        }

        const providerKey = this.localStorage.getItem(OAUTH_CURRENT_PROVIDER_KEY) as OauthProvider | null
        this._setCurrentProvider(providerKey, true);

        this._currentAccessTokenData = this._loadTokenData();
        const isLoggedIn = await this.checkLoggedIn();

        console.log(`Login context initialized. User ${isLoggedIn ? 'is' : 'is not'} logged in succesfully`);
    }

    async login(provider: OauthProvider, restoreRoute?: ActivatedRoute | null) {
        this._setCurrentProvider(provider);
        this.saveRestoreRoute(restoreRoute);

        const providerParams = this.currentProviderParams!;

        const stateToken = this._generateStateToken();
        const codeVerifierToken = this._generateCodeVerifierToken();
        const codeChallengeToken = await getCodeChallenge(codeVerifierToken);

        const authorizeParams = new URLSearchParams();
        authorizeParams.set('client_id', providerParams.clientId);
        authorizeParams.set('response_type', 'code');
        authorizeParams.set('redirect_uri', this.authorizeRedirectUri);
        authorizeParams.set('response_mode', 'query');
        authorizeParams.set('scope', encodeURIComponent(providerParams.requiredScope.join(' ')));
        authorizeParams.set('state', encodeURIComponent(stateToken));
        authorizeParams.set('code_challenge_method', 'S256');
        authorizeParams.set('code_challenge', codeChallengeToken);

        const authorizeUrl = `${providerParams.authorizeUrl}?${authorizeParams}`;
        this.externalNavigation.go(authorizeUrl);
    }

    logout(): void {
        this.clearLocalStorage();
        this.router.navigateByUrl('/public');
    }

    /**
     * Called by /sso-redirect page in order to finalize the login state.
     * @param authorizationCode
     * @param state
     */
    async finalizeLogin(
        authorizationCode: string,
        state: string
    ): Promise<AccessTokenResponse | AccessTokenErrorResponse> {
        this._verifyStateToken(state);
        return await this.authorizationCodeGrant(authorizationCode);
    }

    clearLocalStorage() {
        this._clearCodeVerifierToken();
        this._clearStateToken();
        this._clearTokenData();
        this.localStorage.removeItem(OAUTH_RESTORE_ROUTE_KEY);
    }

    _saveTokenData(tokenData: AccessTokenData) {
        if (this.currentProvider != tokenData.provider) {
            throw new Error(`oauth provider mismatch. Expected ${this.currentProvider}, got ${tokenData.provider}`);
        }
        this.localStorage.setItem(OAUTH_ACCESS_TOKEN_STORAGE_KEY, tokenData.accessToken);

        this.localStorage.setItem(OAUTH_ACCESS_TOKEN_EXPIRES_AT_KEY, tokenData.expiresAt.toISOString());

        if (tokenData.refreshToken != null) {
            this.localStorage.setItem(OAUTH_REFRESH_TOKEN_STORAGE_KEY, tokenData.refreshToken);
        } else {
            this.localStorage.removeItem(OAUTH_REFRESH_TOKEN_STORAGE_KEY);
        }
        this._currentAccessTokenData = tokenData;
    }

    _loadTokenData(): AccessTokenData | null {
        if (this.currentProvider == null) {
            return null;
        }

        const accessToken = this.localStorage.getItem(OAUTH_ACCESS_TOKEN_STORAGE_KEY);
        if (accessToken == null) {
            return null;
        }
        const expiresAt_raw = this.localStorage.getItem(OAUTH_ACCESS_TOKEN_EXPIRES_AT_KEY);
        if (expiresAt_raw == null) {
            throw new Error('oauth access token has no associated expiry');
        }
        const expiresAt = parseISO(expiresAt_raw);

        const refreshToken = this.localStorage.getItem(OAUTH_REFRESH_TOKEN_STORAGE_KEY);

        return {
            provider: this.currentProvider,
            accessToken,
            expiresAt,
            refreshToken
        }
    }

    _clearTokenData(): void {
        this.localStorage.removeItem(OAUTH_ACCESS_TOKEN_STORAGE_KEY);
        this.localStorage.removeItem(OAUTH_ACCESS_TOKEN_EXPIRES_AT_KEY);
        this.localStorage.removeItem(OAUTH_REFRESH_TOKEN_STORAGE_KEY);
    }


    async authorizationCodeGrant(authorizationCode: string): Promise<AccessTokenResponse | AccessTokenErrorResponse> {
        const providerParams = this.currentProviderParams;
        if (providerParams == null) {
            throw new Error('No current oauth provider');
        }

        const codeVerifierToken = this._loadCodeVerifierToken();
        this._clearCodeVerifierToken();

        const grantRequest = new URLSearchParams();
        grantRequest.set('client_id', providerParams.clientId);
        grantRequest.set('scope', encodeURIComponent(providerParams.requiredScope.join(' ')));
        grantRequest.set('grant_type', 'authorization_code');
        grantRequest.set('code', authorizationCode);
        grantRequest.set('code_verifier', codeVerifierToken);
        grantRequest.set('redirect_uri', this.authorizeRedirectUri);

        const response = await this._requestGrant(grantRequest);

        if (isAccessTokenResponse(response)) {
            this._saveTokenData(fromAccessTokenResponse(this.currentProvider!, response));
        }
        return response;
    }

    async refreshTokenGrant(): Promise<AccessTokenResponse | AccessTokenErrorResponse> {
        const providerParams = this.currentProviderParams;
        if (providerParams == null) {
            throw new Error('No current oauth provider');
        }

        const refreshToken = this.localStorage.getItem(OAUTH_REFRESH_TOKEN_STORAGE_KEY);
        if (refreshToken == null) {
            throw new Error('No current refresh token');
        }
        const grantRequest = new URLSearchParams();
        grantRequest.set('client_id', providerParams.clientId);
        grantRequest.set('scope', encodeURIComponent(providerParams.requiredScope.join(' ')));
        grantRequest.set('grant_type', 'refresh_token');
        grantRequest.set('refresh_token', refreshToken);

        const response = await this._requestGrant(grantRequest);
        if (isAccessTokenResponse(response)) {
            this._saveTokenData(fromAccessTokenResponse(this.currentProvider!, response));
        }
        return response;
    }

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

    _generateStateToken() {
        if (this.localStorage.getItem(OAUTH_STATE_TOKEN_KEY) != null) {
            throw new Error('Oauth state has already been set');
        }

        const stateToken = btoa(generateRandomToken(10))
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
        this.localStorage.setItem(OAUTH_STATE_TOKEN_KEY, stateToken);
        return stateToken;
    }

    _loadStateToken(): string {
        const stateToken = this.localStorage.getItem(OAUTH_STATE_TOKEN_KEY);
        if (stateToken == null) {
            throw new Error('Oauth state not set');
        }
        return stateToken;
    }

    _clearStateToken(): void {
        this.localStorage.removeItem(OAUTH_STATE_TOKEN_KEY);
    }

    _verifyStateToken(expectedValue: string): void {
        const stateToken = this._loadStateToken();
        if (stateToken != expectedValue) {
            throw new Error('Oauth state token mismatch');
        }
        this._clearStateToken();
    }

    private _generateCodeVerifierToken() {
        if (this.localStorage.getItem(OAUTH_CODE_VERIFIER_KEY)) {
            throw new Error('Oauth verifier already initialized');
        }

        const verifierToken = generateRandomToken(128);
        this.localStorage.setItem(OAUTH_CODE_VERIFIER_KEY, verifierToken);
        return verifierToken;
    }

    private _loadCodeVerifierToken(): string {
        const verifierToken = this.localStorage.getItem(OAUTH_CODE_VERIFIER_KEY);
        if (verifierToken == null) {
            throw new Error('Oauth code verifier token not initialized')
        }
        return verifierToken;
    }

    private _clearCodeVerifierToken(): void {
        this.localStorage.removeItem(OAUTH_CODE_VERIFIER_KEY);
    }

    private _requestGrant(content: URLSearchParams): Promise<AccessTokenResponse | AccessTokenErrorResponse> {
        const providerParams = this.currentProviderParams;
        if (providerParams == null) {
            throw new Error('No current oauth provider');
        }
        return firstValueFrom(
            this.httpClient.post<AccessTokenResponse | AccessTokenErrorResponse>(
                providerParams.tokenUrl,
                content.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            ).pipe(
                timeout(1000),
                catchError(err => {
                    if (err instanceof HttpErrorResponse) {
                        return of(err.error);
                    }
                    throw err;
                })
            )
        );

    }
}


const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890-._~" as const;

function generateRandomToken(length: number): string {
    const arr = new Uint8Array(length);
    crypto.getRandomValues(arr);

    const tokenChars = Array.from(arr).map((item) => chars[item % chars.length]);
    return tokenChars.join('');
}

async function getCodeChallenge(verifierToken: string): Promise<string> {
    const tokenBytes = new TextEncoder().encode(verifierToken);
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", tokenBytes));
    return btoa(String.fromCharCode(...digest))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
}