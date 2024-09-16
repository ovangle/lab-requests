export type JsonObject = { [k: string]: unknown };

export function isJsonObject(obj: unknown): obj is JsonObject {
  return typeof obj === 'object' && obj != null;
}

export function nullableFromJson<T>(fromJson: (obj: unknown) => T): (json: unknown) => T | null {
  return (json: unknown) => {
    if (json == null) {
      return null;
    } else {
      return fromJson(json)
    }
  };
}