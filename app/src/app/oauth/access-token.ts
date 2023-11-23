import { add, formatISO, parseISO } from "date-fns";
import { OauthProvider, OauthProviderContext, OauthProviderParams, isOauthProvider } from "./oauth-provider";
import { Injectable, inject } from "@angular/core";
import { LocalStorage } from "../utils/local-storage";
import { isJsonObject } from "../utils/is-json-object";


export interface AccessTokenResponse {
    readonly access_token: string;
    readonly expires_in: number;
    readonly refresh_token: string | null;
}

export interface AccessTokenErrorResponse {
    readonly error: string;
    readonly error_description: string;
}

export interface AccessTokenData {
    readonly provider: OauthProvider;
    readonly clientId: string;
    readonly scope: string[];

    readonly accessToken: string;
    readonly expiresAt: Date;
    readonly refreshToken: string | null;
}

export function isAccessTokenData(obj: unknown): obj is AccessTokenData {
    return typeof obj === 'object' && obj != null
        && isOauthProvider((obj as any)['provider'])
        && typeof (obj as any)['clientId'] === 'string'
        && typeof (obj as any)['accessToken'] === 'string';
        
}

export function accessTokenResponseToAccessTokenData(
    {provider, clientId, requiredScope}: OauthProviderParams,
    response: AccessTokenResponse
): AccessTokenData {
    return {
        provider,
        clientId,
        scope: requiredScope,
        accessToken: response.access_token,
        expiresAt: add(new Date(), {seconds: response.expires_in}),
        refreshToken: response.refresh_token
    };
}

export function accessTokenDataFromJson(json: unknown): AccessTokenData {
    if (!isJsonObject(json)) {
        throw new Error('Expected a json object');
    }
    if (!isOauthProvider(json['provider'])) {
        throw new Error('Expected an oauth \'provider\'');
    }
    if (typeof json['clientId'] !== 'string') {
        throw new Error('Expected a string \'clientId\'');
    }
    if (typeof json['accessToken'] !== 'string') {
        throw new Error('Expected a string \'accessToken\'')
    }
    if (!Array.isArray(json['scope'])) {
        throw new Error('Expected an array of strings \'scope\'')
    }
    if (typeof json['expiresAt'] !== 'string') {
        throw new Error('Expected a string \'expiresAt\'');
    }
    if (typeof json['refreshToken'] !== 'string' && json['refreshToken'] !== null) {
        throw new Error('Expected a string or null \'refreshToken\'');
    }
    return {
        provider: json['provider'],
        clientId: json['clientId'],
        accessToken: json['accessToken'],
        scope: json['scope'],
        expiresAt: parseISO(json['expiresAt']),
        refreshToken: json['refreshToken']
    };
}

export function accessTokenDataToJson(data: AccessTokenData) {
    return {
        provider: data.provider,
        accessToken: data.accessToken,
        expiresAt: formatISO(data.expiresAt),
        refreshToken: data.refreshToken
    };
}

export const OAUTH_ACCESS_TOKEN_STORAGE_KEY = 'oauthAccessToken';

@Injectable({providedIn: 'root'})
export class AccessTokenStore {
    readonly storage = inject(LocalStorage);
    readonly _oauthProviderContext = inject(OauthProviderContext);

    constructor() {
        const tokenData = this.load();
        if (tokenData != null) {
            this._oauthProviderContext.setCurrent(tokenData.provider);
        }
        this._oauthProviderContext.registerOnChange(() => {
            console.warn('clearing token data on provider change');
            this.clearTokenData();
        });
    }

    hasTokenData() {
        return this.storage.getItem(OAUTH_ACCESS_TOKEN_STORAGE_KEY) != null;
    }

    clearTokenData() {
        this.storage.removeItem(OAUTH_ACCESS_TOKEN_STORAGE_KEY);
    }

    saveToken(tokenData: AccessTokenData) {
        const json = accessTokenDataToJson(tokenData);
        this.storage.setItem(OAUTH_ACCESS_TOKEN_STORAGE_KEY, JSON.stringify(json))
    }

    load(): AccessTokenData | null {
        const json = this.storage.getItem(OAUTH_ACCESS_TOKEN_STORAGE_KEY);
        if (json) {
            try {
                return accessTokenDataFromJson(JSON.parse(json));
            } catch (err) {
                console.log('Received error when attempting to load non-null token');
                console.log(err);
                return null;
            }
        }
        return null;
    }
}