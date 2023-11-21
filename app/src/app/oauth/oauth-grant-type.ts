

const OAUTH_GRANT_TYPES = [
    'password',
    'authorization_code',
    'refresh_token'
] as const;

export type OauthGrantType = typeof OAUTH_GRANT_TYPES[number];

export function isOauthGrantType(obj: unknown): obj is OauthGrantType {
    return typeof obj === 'string'
        && OAUTH_GRANT_TYPES.includes(obj as any);
}