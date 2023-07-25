import { DOCUMENT } from "@angular/common";
import { Inject, Provider } from "@angular/core";

export class LocalStorage extends Proxy<Storage> {
    constructor(
        @Inject(DOCUMENT)
        _document: Document
    ) {
        const window = _document.defaultView;
        if (window == null) {
            throw new Error('No access to local storage from platform');
        }
        super(window.localStorage, {});
    }
}

export function provideLocalStorage(): Provider[] {
    return [LocalStorage];
}