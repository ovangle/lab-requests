

export const STORAGE_TYPES = [
    'general',
    'samples',
    'chemical',
    'dry',
    'biological',
    'cold (-4 °C)',
    'frozen (-18 °C)',
    'ult (-80 °C)',
    'other',
] as const;

export type StorageType = (typeof STORAGE_TYPES)[number];

export function isStorageType(obj: unknown): obj is StorageType {
    return typeof obj === 'string'
        && STORAGE_TYPES.includes(obj as any);
}

export interface StorageTypeFormatOptions { }

export function formatStorageType(storageType: StorageType, options: StorageTypeFormatOptions = {}): string {
    return storageType;
}