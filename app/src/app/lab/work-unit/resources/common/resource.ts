import { Inject, Injectable, inject } from "@angular/core";
import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject, Observable, Subscription, combineLatest, filter, firstValueFrom, map, shareReplay, tap } from "rxjs";
import { InputMaterialResourceFormComponent } from "../material/input/input-material-resource-form.component";
import { RESOURCE_TYPE } from "./resource-form.component";
import { ResourceContainerContext } from "../resource-container";
import { ResourceContainerForm, ResourceContainerFormService } from "../resource-container-form";

export type ResourceType = 'software' | 'equipment' | 'service' | 'input-material' | 'output-material';


export interface Resource {
    readonly type: ResourceType;
}

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
export abstract class ResourceContext<T extends Resource, TPatch extends ResourcePatch> {
    readonly _containerContext = inject(ResourceContainerContext);
    readonly container$ = this._containerContext.committed$;

    readonly resourceTypeSubject = new BehaviorSubject<ResourceType | null>(null);
    readonly resourceType$: Observable<ResourceType> = this.resourceTypeSubject.pipe(
        filter((r): r is ResourceType => r != null)
    );

    abstract readonly resourceTypeFromContext$: Observable<ResourceType | null>;

    readonly indexSubject = new BehaviorSubject<number>(-1);
    readonly index$ = this.indexSubject.asObservable();

    abstract readonly indexFromContext$: Observable<number>;

    readonly resourceSubject = new BehaviorSubject<T | null>(null);
    readonly resource$: Observable<T | null> = combineLatest([
        this.container$, 
        this.resourceType$,
        this.index$
    ]).pipe(
        map(([container, resourceType, index]) => resourceType && container.getResourceAt(resourceType, index) || null),
        tap(this.resourceSubject),
        shareReplay(1)
    );

    get _typeIndex(): [ResourceType, number] {
        const resourceType = this.resourceTypeSubject.value;
        if (resourceType == null) {
            throw new Error('Cannot access resource type yet');
        }
        const index = this.indexSubject.value;
        return [resourceType!, index];
    }

    connect() {
        this.resourceTypeFromContext$.subscribe(this.resourceTypeSubject);
        this.indexFromContext$.subscribe(this.indexSubject);

        return new Subscription(() => {
            this.resourceTypeSubject.complete();
            this.indexSubject.complete();
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