import { Inject, Injectable, inject } from "@angular/core";
import { FormArray, FormGroup } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject, Observable, combineLatest, firstValueFrom, map } from "rxjs";
import { InputMaterialResourceFormComponent } from "../material/input/input-material-resource-form.component";
import { ResourceContainerFormService } from "../resources";
import { RESOURCE_TYPE } from "./resource-form.component";

export type ResourceType = 'software' | 'equipment' | 'service' | 'input-material' | 'output-material';


export interface Resource {
    readonly type: ResourceType;
}

const RESOURCE_TYPE_NAMES: {[K in ResourceType]: string} = {
    'service': 'Service',
    'equipment': 'Equipment',
    'software': 'Software',
    'input-material': 'Input material',
    'output-material': 'Output material'
}

export function resourceTypeName(r: ResourceType) {
    return RESOURCE_TYPE_NAMES[r];
}

export interface CostEstimate {
    isUniversitySupplied: boolean;
    estimatedCost: number;
}

export type CostEstimateForm = FormGroup<{}>;

export function costEstimateForm(costEstimate?: CostEstimate | null): CostEstimateForm {
    return new FormGroup({}); 
}