import { Injectable, inject } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Observable, ReplaySubject, Subscription, combineLatest, defer, filter, map, shareReplay } from "rxjs";
import { ResourceContainer, ResourceContainerContext } from "./resource-container";
import { ResourceType, isResourceType } from "./resource-type";
import { ExperimentalPlan } from "../../experimental-plan/experimental-plan";

export type ResourceParams<T extends Resource> = Partial<T> & {
    planId: string;
    workUnitId: string;
    index: number | 'create';
}

export interface Resource {
    readonly type: ResourceType;

    readonly planId: string;
    readonly workUnitId: string;
    readonly index: number | 'create';
}
export type ResourceTypeIndex = [ResourceType, number | 'create'];

export function isResourceTypeIndex(obj: any): obj is ResourceTypeIndex {
    return Array.isArray(obj) 
        && obj.length == 2 
        && isResourceType(obj[0])
        && (typeof obj[1] === 'number' || obj[1] === 'create');
}

@Injectable()
export class ResourceContext<T extends Resource> {
    readonly _containerContext = inject(ResourceContainerContext);
    readonly container$ = defer(() => this._containerContext.committed$.pipe(
        filter((committed): committed is ResourceContainer => {
            if (committed == null) {
                throw new Error('no current container context.')
            }
            return true;
        })
    ));

    readonly _committedTypeIndexSubject = new ReplaySubject<[ResourceType, number | 'create']>(1);
    readonly committedTypeIndex$ = this._committedTypeIndexSubject.asObservable();

    readonly resourceType$ = defer(() => this.committedTypeIndex$.pipe(map(([type, _]) => type)));
    readonly isCreate$ = defer(
        () => this.committedTypeIndex$.pipe(map(([_, index]) => index === 'create'))
    );

    readonly committed$: Observable<T | null> = combineLatest([
        this.container$,
        this.committedTypeIndex$
    ]).pipe(
        map(([container, typeIndex]: [ResourceContainer, ResourceTypeIndex]) => {
            const [resourceType, index] = typeIndex;
            
            return index === 'create' ? null : container.getResourceAt<T>(resourceType, index);
        }),
        shareReplay(1)
    );

    sendTypeIndex(typeIndex$: Observable<ResourceTypeIndex>): Subscription {
        typeIndex$.subscribe((typeIndex) => this._committedTypeIndexSubject.next(typeIndex));

        return new Subscription(() => {
            this._committedTypeIndexSubject.complete();
        });
    }
}

export interface CostEstimate {
    isUniversitySupplied: boolean;
    estimatedCost: number;
}

export function costEstimateFromJson(json: {[k: string]: any}): CostEstimate {
    return { 
        isUniversitySupplied: json['isUniversitySupplied'],
        estimatedCost: json['estimatedCost']
    }
}

export function costEstimateToJson(cost: CostEstimate) {
    return {
        isUniversitySupplied: cost.isUniversitySupplied,
        estimatedCost: cost.estimatedCost
    };
}

export type CostEstimateForm = FormGroup<{
    isUniversitySupplied: FormControl<boolean>;
    estimatedCost: FormControl<number>;
}>;

export function costEstimateForm(initial?: CostEstimate): CostEstimateForm {
    return new FormGroup({
        isUniversitySupplied: new FormControl(!!initial?.isUniversitySupplied, {nonNullable: true}),
        estimatedCost: new FormControl(initial?.estimatedCost || 0, {nonNullable: true})
    });
}