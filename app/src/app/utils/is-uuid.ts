import {validate as validateIsUUID} from 'uuid';

export type UUID = string;

export function isUUID(obj: unknown): obj is UUID {
    return typeof obj === 'string' && validateIsUUID(obj);
}