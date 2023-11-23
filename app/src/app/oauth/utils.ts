import { PlatformLocation } from "@angular/common";
import { InjectionToken, Provider, inject } from "@angular/core";


export function oauthScopeToQueryParam(scopes: string[]) {
    return encodeURIComponent(scopes.join(' '));
}

export function oauthScopeFromQueryParam(rawScope: string): string[] {
    return decodeURIComponent(rawScope).split(' ');
}

export function injectAuthRedirectUrl(): string {
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
    return baseUrl + location.prepareExternalUrl('/oauth/redirect');
}