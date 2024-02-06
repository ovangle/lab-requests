import { Injectable, inject } from "@angular/core";
import { Observable, ReplaySubject, defer, map, combineLatest, shareReplay, Subscription } from "rxjs";
import { Resource, ResourceTypeIndex, ResourceParams } from "./resource";
import { ResourceContainerContext, ResourceContainer } from "./resource-container";

@Injectable()
export class ResourceContext<T extends Resource> {
    readonly _containerContext = inject(ResourceContainerContext);

    readonly funding$ = this._containerContext.funding$;
    readonly container$: Observable<ResourceContainer> = this._containerContext.committed$;

    readonly _committedTypeIndexSubject = new ReplaySubject<ResourceTypeIndex>(1);
    readonly committedTypeIndex$ = this._committedTypeIndexSubject.asObservable();

    readonly resourceType$ = defer(() =>
        this.committedTypeIndex$.pipe(map(([ type, _ ]) => type)),
    );
    readonly isCreate$ = defer(() =>
        this.committedTypeIndex$.pipe(map(([ _, index ]) => index === 'create')),
    );

    readonly committed$: Observable<T | null> = combineLatest([
        this.container$,
        this.committedTypeIndex$,
    ]).pipe(
        map(([ container, typeIndex ]: [ ResourceContainer, ResourceTypeIndex ]) => {
            const [ resourceType, index ] = typeIndex;

            return index === 'create'
                ? null
                : container.getResourceAt<T>(resourceType, index);
        }),
        shareReplay(1),
    );

    sendTypeIndex(typeIndex$: Observable<ResourceTypeIndex>): Subscription {
        typeIndex$.subscribe((typeIndex) =>
            this._committedTypeIndexSubject.next(typeIndex),
        );

        return new Subscription(() => {
            this._committedTypeIndexSubject.complete();
        });
    }

    async commit(resource: T) {
        throw new Error('not implemented');
    }
}
