
export function isJsonObject(obj: unknown): obj is {[k: string]: unknown} {
    return typeof obj === 'object' && obj != null;
}