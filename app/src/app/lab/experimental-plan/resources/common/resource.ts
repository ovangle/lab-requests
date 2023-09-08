import { Inject, Injectable, inject } from "@angular/core";
import { FormArray, FormGroup, ValidationErrors } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject, Observable, combineLatest, firstValueFrom, map, shareReplay, tap } from "rxjs";
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

export function resourceTypeName(r: ResourceType) {
    return RESOURCE_TYPE_NAMES[r];
}

@Injectable()
export class ResourceContext<T extends Resource, TPatch extends ResourcePatch> {
    readonly _containerContext = inject(ResourceContainerContext);
    readonly container$ = this._containerContext.committed$;

    readonly _containerFormService = inject(ResourceContainerFormService);
    readonly containerForm: ResourceContainerForm<any> = this._containerFormService.form;

    readonly resourceType = inject(RESOURCE_TYPE);
    readonly indexSubject = new BehaviorSubject<number>(-1);
    readonly index$ = this.indexSubject.asObservable();

    readonly resourceSubject = new BehaviorSubject<T | null>(null);
    readonly resource$: Observable<T | null> = combineLatest([this.container$, this.index$]).pipe(
        map(([container, index]) => container.getResourceAt(this.resourceType, index) || null),
        tap(this.resourceSubject),
        shareReplay(1)
    );

    get resourceForm(): FormGroup<any> | null {
        const index = this.indexSubject.value;
        return this._containerFormService.getResourceForm(this.resourceType, index)
    }
}

export interface CostEstimate {
    isUniversitySupplied: boolean;
    estimatedCost: number;
}

export type CostEstimateForm = FormGroup<{}>;

export function costEstimateForm(costEstimate?: CostEstimate | null): CostEstimateForm {
    return new FormGroup({}); 
}
