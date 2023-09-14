import { Inject, Injectable, inject } from "@angular/core";
import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject, Observable, Subject, Subscription, combineLatest, defer, filter, firstValueFrom, map, of, shareReplay, switchMap, tap } from "rxjs";
import { InputMaterialResourceFormComponent } from "../material/input/input-material-resource-form.component";
import { RESOURCE_TYPE } from "./resource-form.component";
import { ResourceContainer, ResourceContainerContext } from "../resource-container";
import { ResourceContainerForm, ResourceContainerFormService } from "../resource-container-form";

export type ResourceType = 'software' | 'equipment' | 'service' | 'input-material' | 'output-material';

export interface Resource {
    readonly type: ResourceType;
}

export type ResourceId = [ResourceType, number | 'create'];

export interface ResourcePatch {

}

export type ResourcePatchErrors = ValidationErrors;

export const RESOURCE_TYPE_NAMES: {[K in ResourceType]: string} = {
    'service': 'Service',
    'equipment': 'Equipment',
    'software': 'Software',
    'input-material': 'Input material',
    'output-material': 'Output material'
}

export const ALL_RESOURCE_TYPES: ResourceType[] = Object.keys(RESOURCE_TYPE_NAMES) as ResourceType[];

export function isResourceType(obj: any): obj is ResourceType {
    return typeof obj === 'string' 
        && Object.keys(RESOURCE_TYPE_NAMES).includes(obj);
}

export function resourceTypeName(r: ResourceType) {
    return RESOURCE_TYPE_NAMES[r];
}

@Injectable()
export class ResourceContext<T extends Resource, TPatch extends ResourcePatch> {
    readonly _containerContext = inject(ResourceContainerContext);
    readonly container$ = defer(() => this._containerContext.committed$.pipe(
        filter((committed): committed is ResourceContainer => {
            if (committed == null) {
                throw new Error('no current container context.')
            }
            return true;
        })
    ));

    readonly _committedTypeIndexSubject = new Subject<[ResourceType, number | 'create']>();
    readonly committedTypeIndex$ = this._committedTypeIndexSubject.asObservable();

    readonly resourceType$ = defer(() => this.committedTypeIndex$.pipe(map(([type, _]) => type)));

    readonly committed$: Observable<T | null> = combineLatest([
        this.container$,
        this.committedTypeIndex$
    ]).pipe(
        map(([container, typeIndex]: [ResourceContainer, [ResourceType, number | 'create']]) => {
            const [resourceType, index] = typeIndex;
            
            return index === 'create' ? null : container.getResourceAt<T>(resourceType, index);
        }),
        shareReplay(1)
    );

    sendTypeIndex(typeIndex$: Observable<[ResourceType, 'create' | number]>): Subscription {
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