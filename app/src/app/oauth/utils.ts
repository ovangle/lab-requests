

export function oauthScopeToQueryParam(scopes: string[]) {
    return encodeURIComponent(scopes.join(' '));
}

export function oauthScopeFromQueryParam(rawScope: string): string[] {
    return decodeURIComponent(rawScope).split(' ');
}