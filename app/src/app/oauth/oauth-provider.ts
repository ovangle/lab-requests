import { Inject, Injectable, InjectionToken, Provider, SimpleChange, inject } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { API_BASE_URL } from "src/app/common/model/model-service";


const OAUTH_PROVIDERS = [
    'ovangle.com',
    'cqu--microsoft'
]

export type OauthProvider = typeof OAUTH_PROVIDERS[number];

export const NATIVE_OAUTH_PROVIDER = 'ovangle.com';

export function isOauthProvider(obj: unknown): obj is OauthProvider {
    return typeof obj === 'string' && OAUTH_PROVIDERS.includes(obj as any);
}


export interface OauthProviderParams {
    readonly provider: OauthProvider;
    authorizeUrl: string;
    tokenUrl: string;
    clientId: string;
    requiredScope: string[];
}

function provideNativeProviderParams(): Provider {
    const apiBaseUrl = inject(API_BASE_URL);
    return {
        provide: OAUTH_PARAMS, 
        multi: true, 
        useValue: {
            provider: 'ovangle.com',
            authorizeUrl: `${apiBaseUrl}/auth/authorize`,
            tokenUrl: `${apiBaseUrl}/auth/token`,
            clientId: 'client-id',
            requiredScope: [
                `${apiBaseUrl}/user/read`,
                `${apiBaseUrl}/lab/read+write`,
            ]
        }
    };
}


function provideMicrosoftProviderParams(params: {
    tenantId: string,
    clientId: string,
    requiredScope: string[]
}): Provider {
    const baseUrl = `https://login.microsoft.com/${params.tenantId}/oauth2/v2.0`;

    return {
        provide: OAUTH_PARAMS, 
        multi: true,
        useValue: {
            provider: 'cqu--microsoft',
            authorizeUrl: `${baseUrl}/authorize`,
            tokenUrl: `${baseUrl}/token`,
            clientId: params.clientId,
            requiredScope: params.requiredScope
        }
    };
}

export const OAUTH_PARAMS = new InjectionToken<OauthProviderParams>('OAUTH_PARAMS');
    
@Injectable({providedIn: 'root'})
export class OauthProviderRegistry {
    private _registry = new Map<OauthProvider, OauthProviderParams>();

    constructor(
        @Inject(OAUTH_PARAMS)
        params: OauthProviderParams[]
    ) {
        for (const oauthParams of params) {
            try {
                this.get(oauthParams.provider);
            } catch {
                throw new Error(`Multiple param objects registered for provider ${oauthParams.provider}`)
            }
            this._registry.set(oauthParams.provider, oauthParams);
        }
    }

    get(provider: OauthProvider): OauthProviderParams {
        const params = this._registry.get(provider);
        if (!params) {
            throw new Error(`No params for provider ${provider}`);
        }
        return params;
    }
}

@Injectable({providedIn: 'root'})
export class OauthProviderContext {
    readonly _oauthProviderRegistry = inject(OauthProviderRegistry);

    private _current: OauthProvider | undefined = undefined;
    private _onChangeSubscriptions: Array<(p: SimpleChange) => void> = [];

    get isInitialized() {
        return this._current !== undefined;
    }

    get current(): OauthProvider {
        if (this._current === undefined) {
            throw new Error('Uninitialized provider context');
        }
        return this._current;
    }

    get currentParams(): OauthProviderParams {
        return this._oauthProviderRegistry.get(this.current);
    }

    setCurrent(provider: OauthProvider) {
        if (provider !== this._current) {
            const change = new SimpleChange(this._current, provider, this._current === undefined);
            this._current = provider;
            this._onChangeSubscriptions.forEach(listener => listener(change))
        }
    }

    clearCurrent() {
        const change = new SimpleChange(this._current, null, false);
        this._current = undefined;
        this._onChangeSubscriptions.forEach(listener => listener(change));
    }

    registerOnChange(onChange: (p: SimpleChange) => void): () => void {
        this._onChangeSubscriptions.push(onChange);
        return () => {
            this._onChangeSubscriptions.filter(value => value !== onChange);
        };
    }

    removeOnChange(handle: Function) {
        handle();
    }
}