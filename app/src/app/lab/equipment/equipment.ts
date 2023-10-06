import { FormArray, FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { LabType } from "../type/lab-type";
import { Inject, Injectable, Optional, Provider, SkipSelf, inject } from "@angular/core";
import { Lookup, ModelService } from "src/app/utils/models/model-service";
import { Context } from "src/app/utils/models/model-context";
import { Observable, firstValueFrom } from "rxjs";
import { HttpParams } from "@angular/common/http";
import { ModelCollection } from "src/app/utils/models/model-collection";
import { EquipmentTag } from "./tag/equipment-tag";
import { Router } from "@angular/router";
import { CostEstimate } from "src/app/uni/research/funding/cost-estimate/coste-estimate";
import { costEstimateForm } from "src/app/uni/research/funding/cost-estimate/cost-estimate-form.component";
import { Resource, ResourceParams } from "../work-unit/resource/resource";
import { ResourceFileAttachment } from "../work-unit/resource/file-attachment/file-attachment";


export class Equipment {
    readonly type = 'equipment';
    readonly id: string;

    name: string;
    description: string;

    tags: string[]; 
    availableInLabTypes: LabType[] | 'all';

    trainingDescriptions: string[]
    
    constructor(params: Partial<Equipment>) {
        this.id = params.id!;
        this.name = params.name!;
        this.description = params.description!;
        this.tags = Array.from(params.tags!);
        this.availableInLabTypes = params.availableInLabTypes!;
        this.trainingDescriptions = Array.from(params.trainingDescriptions!);
   }
}

export function equipmentFromJson(json: {[k: string]: any}): Equipment {
    return new Equipment({
        id: json['id'],
        name: json['name'],
        description: json['description'],
        availableInLabTypes: Array.from(json['availableInLabTypes'] || []), 
        tags: Array.from(json['tags'] || []),
        trainingDescriptions: Array.from(json['trainingDescriptions'] || [])
    })
}

/**
 * Represents a request to obtain a specific equipment.
 */
export interface EquipmentRequest {
    name: string;
    description: string;
    purchaseCost?: CostEstimate | null;
}

export function isEquipmentRequest(obj: any): obj is EquipmentRequest {
    return typeof obj == 'object' && obj != null && typeof obj.name === 'string';
}

export function equipmentRequestForm() {
    return new FormGroup({
        name: new FormControl('', {nonNullable: true}),
        description: new FormControl('', {nonNullable: true}),
        purchaseCost: costEstimateForm()
    })
}

export interface EquipmentPatch {
    name: string;
    description: string;

    tags: string[];

    availableInLabTypes: LabType[] | 'all';
    trainingDescriptions: string[];
}

export function isEquipmentPatch(obj: any): obj is EquipmentPatch {
    return typeof obj === 'object' && obj != null;
}


export function equipmentPatchToJson(patch: EquipmentPatch) {
    return {
        name: patch.name,
        description: patch.description,
        tags: patch.tags,
        availableInLabTypes: patch.availableInLabTypes, 
        trainingDescriptions: patch.trainingDescriptions
    }
}

export function equipmentPatchFromEquipment(equipment: Equipment): EquipmentPatch {
    return {
        name: equipment.name,
        tags: equipment.tags,
        description: equipment.description,
        availableInLabTypes: equipment.availableInLabTypes,
        trainingDescriptions: equipment.trainingDescriptions
    }
}

export type EquipmentPatchErrors = ValidationErrors & {
    name: {
        notUnique: string | null;
        required: string;
    } | null;
};

export interface EquipmentCreate extends EquipmentPatch {}

export interface EquipmentLookup extends Lookup<Equipment> {
    readonly searchText: string;
}

export function equipmentLookupToHttpParams(lookup: Partial<EquipmentLookup>) {
    return new HttpParams();
}

@Injectable()
export class EquipmentModelService extends ModelService<Equipment, EquipmentPatch> {
    override readonly resourcePath: string = '/lab/equipments'
    override readonly modelFromJson = equipmentFromJson;
    override readonly patchToJson = equipmentPatchToJson;
    override readonly createToJson = equipmentPatchToJson;
    override readonly lookupToHttpParams = equipmentLookupToHttpParams;
}

@Injectable()
export class EquipmentCollection extends ModelCollection<Equipment, EquipmentLookup> {
    readonly models = inject(EquipmentModelService);
}

@Injectable()
export class EquipmentContext extends Context<Equipment, EquipmentPatch> {
    
    override readonly models: EquipmentModelService = inject(EquipmentModelService);
    readonly equipment$ = this.committed$;

    constructor(
        @Optional() @SkipSelf() @Inject(EquipmentContext)
        parentContext?: EquipmentContext
    ) {
        super(parentContext);
    }

    override create(patch: EquipmentPatch): Promise<Equipment> {
        return firstValueFrom(this.models.create(patch));
    }

    override _doCreate(request: EquipmentPatch): Observable<Equipment> {
        return this.models.create(request);
    }
    override _doCommit(identifier: string, patch: EquipmentPatch): Observable<Equipment> {
        return this.models.update(identifier, patch);
    }
}

export function labEquipmentModelServiceProviders(): Provider[] {
    return [
        EquipmentModelService
    ]
}