import { DOCUMENT } from "@angular/common";
import { Injectable, Inject, Provider } from "@angular/core";

@Injectable()
export abstract class LocalStorage implements Storage {
    [name: string]: any;
    length: number;
    abstract clear(): void;
    abstract getItem(key: string): string | null;
    abstract key(index: number): string | null;
    abstract removeItem(key: string): void;
    abstract setItem(key: string, value: string): void;
}
function localStorageFactory(document: Document) {
    const window = document.defaultView;
    if (window == null) {
        throw new Error('No defaultView on document');
    }
    return window.localStorage;
}

export function provideLocalStorage(): Provider[] {
    return [
        {
            provide: LocalStorage,
            useFactory: localStorageFactory,
            deps: [DOCUMENT]
        }
    ]

}
