import { Injectable, inject } from "@angular/core";
import { Observable, ReplaySubject, defer, map, combineLatest, shareReplay, Subscription, tap, BehaviorSubject } from "rxjs";
import { Resource, ResourceTypeIndex, ResourceParams } from "./resource";
import { LabResourceConsumer, LabResourceContainer, LabResourceContainerContext, LabResourceConsumerContext } from "../lab-resource-consumer/resource-container";
import { ResourceType } from "./resource-type";

@Injectable()
export class ResourceContext<T extends Resource> {
    readonly _consumerContext = inject(LabResourceConsumerContext);
    readonly consumer$ = this._consumerContext.committed$;

    readonly lab$ = this._consumerContext.lab$;
    readonly funding$ = this._consumerContext.funding$;

    readonly _containerContext = inject(LabResourceContainerContext<T>);
    readonly resourceType$ = this._containerContext.resourceType$;
    readonly container$ = this._containerContext.committed$;

    readonly currentIndexSubject = new BehaviorSubject<number>(-1);
    readonly currentIndex$: Observable<number> = this.currentIndexSubject.asObservable();

    readonly committed$: Observable<T> = combineLatest([
        this.container$,
        this.currentIndex$,
    ]).pipe(
        map(([ container, index ]: [ LabResourceContainer<T>, number ]) => {
            return container.getResourceAt(index)
        }),
        shareReplay(1),
    );

    observeResourceIndex(index: Observable<number>): Subscription {
        return index.subscribe(i => this.currentIndexSubject.next(i));
    }
}
