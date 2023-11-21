import { Injectable, InjectionToken, Provider, inject } from "@angular/core";
import { Observable, catchError, firstValueFrom, of, throwError, timeout } from "rxjs";
import { OauthProvider, OauthProviderContext } from "../oauth-provider";
import { PlatformLocation, Location } from "@angular/common";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { AccessTokenData, AccessTokenErrorResponse, AccessTokenResponse } from "../access-token";
import { InteractivityChecker } from "@angular/cdk/a11y";
import { LocalStorage } from "src/app/utils/local-storage";
import { OauthGrantType } from "../oauth-grant-type";
import { C } from "@angular/cdk/keycodes";


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
export type OauthFlowStateParams = Omit<OauthFlowState, 'grantType' | 'provider'>;
export function oauthFlowState(
    grantType: OauthGrantType,
    provider: OauthProvider,
    initialState: OauthFlowStateParams
): OauthFlowState {
    return {...initialState, grantType, provider};
}

@Injectable()
export abstract class AbstractOauthFlow<Params, State extends OauthFlowState = OauthFlowState> {
    readonly _oauthProviderContext = inject(OauthProviderContext);
    readonly authorizationRedirectUrl = inject(AUTH_REDIRECT_URL)
    readonly httpClient = inject(HttpClient);

    get oauthProvider() {
        return this._oauthProviderContext.current;
    }

    get oauthProviderParams() {
        return this._oauthProviderContext.currentParams;
    }

    get requiredScope(): string {
        return encodeURIComponent(this.oauthProviderParams.requiredScope.join(' '));
    }

    readonly store = inject(OauthFlowStateStore);

    get state(): State {
        return this.store.load();
    }

    isProviderFlowInProgress(provider: OauthProvider | 'any'): boolean {
        return this.store.isFlowInProgress('any', this.grantType);
    }

    abstract readonly grantType: OauthGrantType;
    abstract requestToUrlSearchParams(request: Params): URLSearchParams;

    abstract _getInitialFlowState(provider: OauthProvider): Promise<OauthFlowStateParams>;

    /**
     * Initialize the flow for the given provider.
     * 
     * @param provider 
     */
    async init(provider: OauthProvider): Promise<State> {
        this._oauthProviderContext.setCurrent(provider);
        this.store.initialize(await this._getInitialFlowState(provider));
        return this.store.load();
    }

    /**
     * Tear down the current flow.
     */
    async teardown(): Promise<void> {
        if (this.isProviderFlowInProgress('any')) {
            this.store.clearCurrentFlowState();
            this._oauthProviderContext.clearCurrent();
        }
    }

    /**
     * Redirect the application to the login page according to the current state
     * 
     * Return the url that is redirected, or `null`.
     */
    abstract redirectToLogin(): string | null;

    abstract isValidParams(obj: unknown): obj is Params;

    fetchToken(params: Params): Promise<AccessTokenData> {
        const content = this.requestToUrlSearchParams(params);

        return firstValueFrom(this.httpClient.post<AccessTokenResponse | AccessTokenErrorResponse>(
            this.oauthProviderParams.tokenUrl,
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
                return throwError(() => err);
            })
        ));
    }
}

const OAUTH_FLOW_STATE_KEY = 'oauth_flow_state';

@Injectable({providedIn: 'root'})
export class OauthFlowStateStore<State extends OauthFlowState> {
    
    readonly storage = inject(LocalStorage);

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

    _checkIsAnyFlowInProgress(): void {
        if (!this.isFlowInProgress('any', 'any')) {
            throw new Error(`No flow in progress`);
        }
    }

    _checkIsNoFlowInProgress(): void {

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

    initialize(state: State): void {
        this._checkIsNoFlowInProgress();
        this.storage.setItem(OAUTH_FLOW_STATE_KEY, JSON.stringify(state))
    }

    clearCurrentFlowState(): void {
        this._checkIsAnyFlowInProgress();
        this.storage.removeItem(OAUTH_FLOW_STATE_KEY);
    }

    private _load() {
        return JSON.parse(this.storage.getItem(OAUTH_FLOW_STATE_KEY)!);
    }

    load(): State {
        this._checkIsAnyFlowInProgress();
        return this._load();
    }

    update(state: State) {
        this.checkIsFlowInProgress(state.provider, state.grantType);
        this.storage.setItem(OAUTH_FLOW_STATE_KEY, JSON.stringify(state));
    }
}
