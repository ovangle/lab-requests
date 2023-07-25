import { InteractivityChecker } from "@angular/cdk/a11y";
import { APP_BASE_HREF, Location } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Inject, Injectable, InjectionToken, Provider } from "@angular/core";
import { DateSelectionModelChange } from "@angular/material/datepicker";
import { ActivatedRoute, NavigationEnd, Router, RouterEvent } from "@angular/router";
import { add, differenceInSeconds, isBefore, parse, parseISO } from "date-fns";
import { Subscription, filter, firstValueFrom, map, tap, timeout } from "rxjs";
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
    requiredScope: string;
}

interface MicrosoftOauthParams {
    readonly provider: 'microsoft';
    readonly tenantId: string;
    readonly clientId: string;
    readonly requiredScope: string;
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

function provideLoginContext(): Provider[] {
    return [
        {
            provide: OAUTH_PARAMS,
            useValue: msOauthParamsAsOauthParams({
                provider: 'microsoft',
                tenantId: '6742fb94-e226-487c-8107-f07af7674594',
                clientId: 'f7983f22-12f2-4c9c-919b-cd80027c190c',
                requiredScope: 'https://graph.microsoft.com mail.read offline_access openid'
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

interface AccessTokenData extends AccessTokenResponse {
    readonly provider: OauthProvider;
}

interface User {
    email: string;
}

@Injectable()
export class LoginContext {
    constructor(
        readonly location: Location,
        readonly router: Router,
        readonly externalNavigation: ExternalNavigation,
        readonly httpClient: HttpClient,

        readonly localStorage: LocalStorage,

        @Inject(OAUTH_PARAMS) readonly oauthParams: OauthParams[]
    ) {}

    private _saveCurrentNavigation: Subscription;

    get currentProvider(): OauthProvider | null {
        return this._currentProviderParams?.provider || null;
    }
    get currentProviderParams(): OauthParams | null {
        return this._currentProviderParams;
    }
    private _setCurrentProvider(value: OauthProvider | null) {
        if (value == this.currentProvider) {
            return;
        }
        this.clearLocalStorage();
        this._currentAccessToken = null;
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
    _currentProviderParams: OauthParams | null;

    get currentAccessToken(): AccessTokenData | null {
        return this._currentAccessToken;
    }
    _currentAccessToken: AccessTokenData | null;

    //  get currentUser(): User | null {
    //     return this._currentUser;
    // }
    // _currentUser: User | null;

    async checkLoggedIn(): Promise<boolean> {
        let accessTokenData = this.currentAccessToken;
        if (accessTokenData && accessTokenData.expires_in < 0 && accessTokenData.refresh_token) {
            await this.refreshTokenGrant();
            accessTokenData = this.currentAccessToken;
        }
        return !!accessTokenData && accessTokenData.expires_in >= 0;
    }

    async init(options?: {
        clear?: boolean
    }) {
        const isClearContext = !!(options && options.clear);
        if (isClearContext) {
            this.clearLocalStorage();
        }

        this._setCurrentProvider(
            this.localStorage.getItem(OAUTH_CURRENT_PROVIDER_KEY) as OauthProvider | null
        );

        this._currentAccessToken = this._loadTokenData();
        const isLoggedIn = await this.checkLoggedIn();

        console.log(`Login context initialized. User ${isLoggedIn ? 'is' : 'is not'} logged in succesfully`);
    }

    async login(provider: OauthProvider, restoreRoute?: ActivatedRoute | null) {
        this._setCurrentProvider(provider);
        this.saveRestoreRoute(restoreRoute);

        const providerParams = this.currentProviderParams!;

        const redirectUri = this.location.prepareExternalUrl('/sso-redirect');

        const stateToken = this._generateStateToken();
        const codeVerifierToken = this._generateCodeVerifierToken();
        const codeChallengeToken = await getCodeChallenge(codeVerifierToken);

        const authorizeParams = new URLSearchParams();
        authorizeParams.set('client_id', providerParams.clientId);
        authorizeParams.set('response_type', 'code');
        authorizeParams.set('redirect_uri', redirectUri);
        authorizeParams.set('response_mode', 'query');
        authorizeParams.set('scope', providerParams.requiredScope);
        authorizeParams.set('state', stateToken);
        authorizeParams.set('code_challenge_method', 'S256');
        authorizeParams.set('code_challenge', codeChallengeToken);

        const authorizeUrl = `${providerParams.authorizeUrl}?${authorizeParams}`;
        this.externalNavigation.go(authorizeUrl);
    }

    /**
     * Called by /sso-redirect page in order to finalize the login state.
     * @param authorizationCode
     * @param state
     */
    async finalizeLogin(
        authorizationCode: string,
        state: string
    ): Promise<any> {
        this._verifyStateToken(state);

        this.authorizationCodeGrant(authorizationCode);
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
        this.localStorage.setItem(OAUTH_ACCESS_TOKEN_STORAGE_KEY, tokenData.access_token);

        const expiresAt = add(new Date(), {seconds: tokenData.expires_in});
        this.localStorage.setItem(OAUTH_ACCESS_TOKEN_EXPIRES_AT_KEY, expiresAt.toISOString());
        if (tokenData.refresh_token != null) {
            this.localStorage.setItem(OAUTH_REFRESH_TOKEN_STORAGE_KEY, tokenData.refresh_token);
        } else {
            this.localStorage.removeItem(OAUTH_REFRESH_TOKEN_STORAGE_KEY);
        }
        this._currentAccessToken = tokenData;
    }

    _loadTokenData(): AccessTokenData | null {
        if (this.currentProvider == null) {
            throw new Error('No current provider');
        }

        const access_token = this.localStorage.getItem(OAUTH_ACCESS_TOKEN_STORAGE_KEY);
        if (access_token == null) {
            return null;
        }
        const expiresAt_raw = this.localStorage.getItem(OAUTH_ACCESS_TOKEN_EXPIRES_AT_KEY);
        if (expiresAt_raw == null) {
            throw new Error('oauth access token has no associated expiry');
        }
        const expiresAt = parseISO(expiresAt_raw);
        const expires_in = differenceInSeconds(expiresAt, new Date());
        const refresh_token = this.localStorage.getItem(OAUTH_REFRESH_TOKEN_STORAGE_KEY);

        return {
            provider: this.currentProvider,
            access_token,
            expires_in,
            refresh_token
        }
    }

    _clearTokenData(): void {
        this.localStorage.removeItem(OAUTH_ACCESS_TOKEN_STORAGE_KEY);
        this.localStorage.removeItem(OAUTH_ACCESS_TOKEN_EXPIRES_AT_KEY);
        this.localStorage.removeItem(OAUTH_REFRESH_TOKEN_STORAGE_KEY);
    }


    async authorizationCodeGrant(authorizationCode: string): Promise<AccessTokenData | null> {
        const providerParams = this.currentProviderParams;
        if (providerParams == null) {
            throw new Error('No current oauth provider');
        }

        const codeVerifierToken = this._loadCodeVerifierToken();

        const grantRequest = new URLSearchParams();
        grantRequest.set('client_id', providerParams.clientId);
        grantRequest.set('scope', providerParams.requiredScope);
        grantRequest.set('grant_type', 'authorization_code');
        grantRequest.set('code', authorizationCode);
        grantRequest.set('code_verifier', codeVerifierToken);

        const accessTokenData = await this._requestGrant(grantRequest);
        this._saveTokenData(accessTokenData);
        return accessTokenData;
    }

    async refreshTokenGrant(): Promise<AccessTokenData | null> {
        const providerParams = this.currentProviderParams;
        if (providerParams == null) {
            throw new Error('No current oauth provider');
        }

        const refreshToken = this.localStorage.getItem(OAUTH_REFRESH_TOKEN_STORAGE_KEY);
        if (refreshToken == null) {
            return null;
        }
        const grantRequest = new URLSearchParams();
        grantRequest.set('client_id', providerParams.clientId);
        grantRequest.set('scope', providerParams.requiredScope);
        grantRequest.set('grant_type', 'refresh_token');
        grantRequest.set('refresh_token', refreshToken);

        const accessTokenData = await this._requestGrant(grantRequest);
        this._saveTokenData(accessTokenData);
        return accessTokenData;
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
        const routeUrlToRestore = this.localStorage.getItem(OAUTH_RESTORE_ROUTE_KEY) || '/home';
        this.router.navigateByUrl(routeUrlToRestore);
    }
    clearRestoreRoute() {
        this.localStorage.removeItem(OAUTH_RESTORE_ROUTE_KEY);
    }

    _generateStateToken() {
        if (this.localStorage.getItem(OAUTH_STATE_TOKEN_KEY) != null) {
            throw new Error('Oauth state has already been set');
        }

        const stateToken = generateRandomToken(10);
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

    private _requestGrant(content: URLSearchParams): Promise<AccessTokenData> {
        const providerParams = this.currentProviderParams;
        if (providerParams == null) {
            throw new Error('No current oauth provider');
        }
        return firstValueFrom(
            this.httpClient.post<AccessTokenResponse>(
                providerParams.tokenUrl,
                content.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            ).pipe(
                timeout(1000),
                map(accessTokenResponse => ({
                    ...accessTokenResponse,
                    provider: providerParams.provider
                }))
            )
        );

    }
}


const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890-._~" as const;

function generateRandomToken(length: number): string {
    const arr = new Uint8Array(length);
    crypto.getRandomValues(arr);

    const chars = arr.map((item) => chars[item % chars.length]);
    return chars.join();
}

async function getCodeChallenge(verifierToken: string): Promise<string> {
    const tokenBytes = new TextEncoder().encode(verifierToken);
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", tokenBytes));

    return btoa(String.fromCharCode(...digest));
}