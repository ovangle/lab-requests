import { FormArray, FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { LabType } from "../type/lab-type";
import { Injectable, inject } from "@angular/core";
import { ModelService } from "src/app/utils/models/model-service";
import { Context } from "src/app/utils/models/model-context";
import { Observable, firstValueFrom } from "rxjs";


export class Equipment {
    readonly id: string;

    name: string;
    description: string;

    availableInLabTypes: LabType[] | 'all';

    requiresTraining: boolean;
    trainingDescriptions: string[]

    constructor(params: Partial<Equipment>) {
        this.id = params.id!;
        this.name = params.name!;
        this.description = params.description!;
        this.availableInLabTypes = params.availableInLabTypes!;
        this.requiresTraining = params.requiresTraining!;
        this.trainingDescriptions = params.trainingDescriptions!;
   }
}

export function equipmentFromJson(json: {[k: string]: any}): Equipment {
    return new Equipment({
        id: json['id'],
        name: json['name'],
        description: json['description'],
        availableInLabTypes: Array.from(json['availableInLabTypes']), 
        requiresTraining: json['requiresTraining'],
        trainingDescriptions: Array.from(json['trainingDescriptions'])
    })
}

export interface EquipmentPatch {
    name: string;
    description: string;
    availableInLabTypes: LabType[] | 'all';
    requiresTraining: boolean;
    trainingDescriptions: string[];
}

export function isEquipmentPatch(obj: any): obj is EquipmentPatch {
    return typeof obj === 'object' && obj != null;
}


export function equipmentPatchToJson(patch: EquipmentPatch) {
    return {
        name: patch.name,
        description: patch.description,
        availableInLabTypes: patch.availableInLabTypes, 
        requiresTraining: patch.requiresTraining,
        trainingDescriptions: patch.trainingDescriptions
    }
}

export function equipmentPatchFromEquipment(equipment: Equipment): EquipmentPatch {
    return {
        name: equipment.name,
        description: equipment.description,
        availableInLabTypes: equipment.availableInLabTypes,
        requiresTraining: equipment.requiresTraining,
        trainingDescriptions: equipment.trainingDescriptions
    }
}

export type EquipmentPatchErrors = ValidationErrors & {
    name?: {
        notUnique: string | null;
        required: string;
    };
};

@Injectable()
export class EquipmentModelService extends ModelService<Equipment, EquipmentPatch> {
    override readonly resourcePath: string = '/lab/equipment'
    override readonly modelFromJson = equipmentFromJson;
    override readonly patchToJson = equipmentPatchToJson;
}

@Injectable()
export class EquipmentContext extends Context<Equipment, EquipmentPatch> {
    
    override readonly models: EquipmentModelService = inject(EquipmentModelService);
    readonly equipment$ = this.committed$;

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