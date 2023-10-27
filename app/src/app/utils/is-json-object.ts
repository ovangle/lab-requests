

export type JsonObject = {[k: string]: unknown};

export function isJsonObject(obj: unknown): obj is JsonObject {
    return typeof obj === 'object' && obj != null;
}