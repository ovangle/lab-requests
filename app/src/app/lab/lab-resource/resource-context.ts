import { Injectable, inject } from "@angular/core";
import { Observable, ReplaySubject, defer, map, combineLatest, shareReplay, Subscription, tap, BehaviorSubject, firstValueFrom } from "rxjs";
import { Resource, ResourceTypeIndex, ResourceParams, ResourcePatch } from "./resource";
import { LabResourceConsumer, LabResourceContainer, LabResourceContainerContext, LabResourceConsumerContext } from "../lab-resource-consumer/resource-container";
import { ResourceType } from "./resource-type";
import { C } from "@angular/cdk/keycodes";

@Injectable()
export class ResourceContext<T extends Resource, TPatch extends ResourcePatch> {
    readonly _consumerContext = inject(LabResourceConsumerContext);
    readonly consumer$ = this._consumerContext.committed$;

    readonly lab$ = this._consumerContext.lab$;
    readonly funding$ = this._consumerContext.funding$;

    readonly _containerContext = inject(LabResourceContainerContext<T, TPatch>);
    readonly resourceType$ = this._containerContext.resourceType$;
    readonly container$ = this._containerContext.committed$;

    readonly resourceIndexSubject = new BehaviorSubject<number | 'create'>('create');
    readonly resourceIndex$ = this.resourceIndexSubject.asObservable();

    readonly maybeCommitted$: Observable<T | null> = combineLatest([
        this.container$,
        this.resourceIndex$,
    ]).pipe(
        map(([ container, index ]: [ LabResourceContainer<T>, number | 'create' ]) => {
            if (index === 'create') {
                return null;
            }
            return container.getResourceAt(index)
        }),
        shareReplay(1),
    );

    observeResourceIndex(index: Observable<number | 'create'>): Subscription {
        return index.subscribe(i => this.resourceIndexSubject.next(i));
    }

    async save(patch: TPatch): Promise<T> {
        const resourceIndex = await firstValueFrom(this.resourceIndex$);

        if (resourceIndex === 'create') {
            const container = await this._containerContext.appendResource(patch);
            return container.items[ container.items.length - 1 ]
        } else {
            const container = await this._containerContext.updateResourceAt(resourceIndex, patch);
            return container.items[ resourceIndex ];
        }
    }
}
