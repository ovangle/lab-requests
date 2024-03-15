import { Injectable, inject } from "@angular/core";
import { Observable, ReplaySubject, defer, map, combineLatest, shareReplay, Subscription, tap } from "rxjs";
import { Resource, ResourceTypeIndex, ResourceParams } from "./resource";
import { ResourceContainerContext, ResourceContainer } from "./resource-container";
import { ResourceType } from "./resource-type";

@Injectable()
export class ResourceContext<T extends Resource> {
    readonly _containerContext = inject(ResourceContainerContext);

    readonly container$: Observable<ResourceContainer> = this._containerContext.committed$;
    readonly funding$ = this._containerContext.funding$;
    readonly lab$ = this._containerContext.lab$;

    readonly _committedTypeIndexSubject = new ReplaySubject<ResourceTypeIndex>(1);
    readonly committedTypeIndex$ = this._committedTypeIndexSubject.asObservable();

    readonly resourceType$: Observable<ResourceType> = defer(() =>
        this.committedTypeIndex$.pipe(
            map(([ type, _ ]) => type),
            shareReplay(1),
            tap(type => console.log('CONTEXT TYPE', type)),
        ),
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
        typeIndex$.subscribe((typeIndex) => {
            console.log('received type index', typeIndex);
            this._committedTypeIndexSubject.next(typeIndex);
        });

        return new Subscription(() => {
            this._committedTypeIndexSubject.complete();
        });
    }

    async commit(resource: T) {
    }
}
