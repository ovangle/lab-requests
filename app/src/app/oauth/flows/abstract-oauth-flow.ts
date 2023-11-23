import { Inject, Injectable, InjectionToken, Provider, Type, inject } from "@angular/core";
import { Observable, catchError, firstValueFrom, map, of, throwError, timeout } from "rxjs";
import { OauthProvider, OauthProviderContext, OauthProviderParams } from "../oauth-provider";
import { PlatformLocation, Location } from "@angular/common";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { AccessTokenData, AccessTokenErrorResponse, AccessTokenResponse, accessTokenResponseToAccessTokenData } from "../access-token";
import { InteractivityChecker } from "@angular/cdk/a11y";
import { LocalStorage } from "src/app/utils/local-storage";
import { OauthGrantType } from "../oauth-grant-type";
import { C } from "@angular/cdk/keycodes";
import { InvalidCredentials } from "../loigin-error";
import { ExternalNavigation } from "src/app/utils/router-utils";


export const AUTH_REDIRECT_URL = new InjectionToken<string>('AUTH_REDIRECT_URI');
export function provideAuthRedirectUri(): Provider {
    const platformLocation = inject(PlatformLocation);
    const location = inject(Location);
    let isDefaultPortForProtocol = false;
    switch (platformLocation.protocol) {
        case 'http:':
            isDefaultPortForProtocol = (platformLocation.port === '80');
            break;
        case 'https:':
            isDefaultPortForProtocol = (platformLocation.port === '443');
            break;
    }

    const host = platformLocation.hostname + (
        isDefaultPortForProtocol ? '' : `:${platformLocation.port}`
    );

    const baseUrl = `${platformLocation.protocol}//${host}`
    return {
        provide: AUTH_REDIRECT_URL,
        useValue: baseUrl + location.prepareExternalUrl('/sso-redirect')
    };
}

export interface OauthFlowState {
    readonly grantType: OauthGrantType;
    readonly provider: OauthProvider;
}
export type OauthFlowStateParams<T extends OauthFlowState> = Omit<T, 'grantType' | 'provider'>;

export function oauthFlowState<State extends OauthFlowState>(
    provider: OauthProvider,
    grantType: OauthGrantType,
    initialState: OauthFlowStateParams<State>
): State {
    return {...initialState, grantType, provider} as State;
}

const OAUTH_FLOW_STATE_KEY = 'oauthFlowState';

/**
 * Global service which perisists state associated with the currently executing 
 * oauth flow into browser local storage.
 * 
 * If the oauth provider context changes, any current flow in progress is cleared
 */
@Injectable({providedIn: 'root'})
export class OauthFlowStateStore {
    readonly storage = inject(LocalStorage);

    constructor(
        providerContext: OauthProviderContext
    ) {
        if (this.isFlowInProgress('any', 'any')) {
            const flowState = this.load();
            providerContext.setCurrent(flowState.provider);
        }

        providerContext.registerOnChange(() => {
            if (this.isFlowInProgress('any', 'any')) {
                const {provider, grantType} = this.load();
                console.warn(`Clearing data for paritally completed ${grantType} flow ${provider}`)
            }
            this.clearCurrentFlowState();
        });
    }

    isFlowInProgress(provider: OauthProvider | 'any', grantType: OauthGrantType | 'any'): boolean {
        const state = this._load(); 
        if (!state) {
            return false;
        }
        if (provider !== 'any' && state.provider !== provider) {
            return false;
        }
        if (grantType !== 'any' && state.grantType !== grantType) {
            return false;
        }
        return true;
    }

    checkIsAnyFlowInProgress(): void {
        if (!this.isFlowInProgress('any', 'any')) {
            throw new Error(`No flow in progress`);
        }
    }

    checkIsNoFlowInProgress(): void {
        if (this.isFlowInProgress('any', 'any')) {
            const state = this.load();
            throw new Error(`Cannot initialize oauth flow. A ${state.provider} ${state.grantType} flow is already in progress`);
        }
    }
    checkIsFlowInProgress(provider: OauthProvider, grantType: OauthGrantType): void {
        if (!this.isFlowInProgress(provider, grantType)) {
            throw new Error(`No ${provider} ${grantType} flow in progress`);
        }
    }

    initialize<State extends OauthFlowState>(state: State): void {
        this.checkIsNoFlowInProgress();
        this.storage.setItem(OAUTH_FLOW_STATE_KEY, JSON.stringify(state))
    }

    clearCurrentFlowState(): void {
        this.checkIsAnyFlowInProgress();
        this.storage.removeItem(OAUTH_FLOW_STATE_KEY);
    }

    private _load() {
        return JSON.parse(this.storage.getItem(OAUTH_FLOW_STATE_KEY)!);
    }

    load<State extends OauthFlowState>(): State {
        this.checkIsAnyFlowInProgress();
        return this._load();
    }

    update<State extends OauthFlowState>(state: State) {
        this.checkIsFlowInProgress(state.provider, state.grantType);
        this.storage.setItem(OAUTH_FLOW_STATE_KEY, JSON.stringify(state));
    }
}

export abstract class OauthFlowFactory {
    readonly grantType: OauthGrantType;
    abstract get(env: OauthFlowEnv, provider: OauthProviderParams, ): AbstractOauthFlow<unknown>;
}

export interface OauthFlowEnv {
    readonly externalNavigation: ExternalNavigation;
    readonly httpClient: HttpClient

    readonly flowStateStore: OauthFlowStateStore;

    readonly authorizationRedirectUrl: string;
}

export abstract class AbstractOauthFlow<TokenParams, FlowState extends OauthFlowState = OauthFlowState> {
    abstract readonly grantType: OauthGrantType;

    readonly providerParams: OauthProviderParams; 
    get provider() { return this.providerParams.provider; }

    readonly externalNavigation: ExternalNavigation;
    readonly httpClient: HttpClient;
    readonly store: OauthFlowStateStore;
    readonly redirectUrl: string;

    constructor(
        env: OauthFlowEnv,    
        providerParams: OauthProviderParams,
    ) {
        this.externalNavigation = env.externalNavigation;
        this.httpClient = env.httpClient;
        this.store = env.flowStateStore;
        this.redirectUrl = env.authorizationRedirectUrl;
        this.providerParams = providerParams;
    }


    abstract generateInitialFlowState(): Promise<FlowState>;
    get state(): FlowState {
        return this.store.load();
    }

    isInProgress(): boolean {
        return this.store.isFlowInProgress(this.provider, this.grantType);
    }

    abstract requestToUrlSearchParams(request: TokenParams): URLSearchParams;

    /**
     * Redirect the application to the login page according to the current state
     * 
     * Return the url that is redirected, or `null`.
     */
    abstract redirectToLogin(): string | null;

    abstract isValidTokenParams(obj: unknown): obj is TokenParams;

    fetchToken(
        params: unknown 
    ): Promise<AccessTokenData> {
        if (!this.isValidTokenParams(params)) {
            throw new Error(`Received invalid params for ${grantType}`)
        }

        const content = this.requestToUrlSearchParams(params);

        return firstValueFrom(
            this._postForm<AccessTokenResponse>(this.providerParams.tokenUrl, content).pipe(
                map((response: AccessTokenResponse) => {
                    return accessTokenResponseToAccessTokenData(this.providerParams, response);
                }),
                catchError(err => throwError(() => {
                    if (err instanceof HttpErrorResponse && err.status === 401) {
                        return InvalidCredentials.fromHttpErrorResponse(err);
                    }
                    return err;
                }))
            )
        );
    }

    protected _postForm<T>(url: string, content: URLSearchParams): Observable<T> {
        return this.httpClient.post<T>(
            url, 
            content.toString(),
            { headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
        ).pipe(timeout(1000))
    }
}
