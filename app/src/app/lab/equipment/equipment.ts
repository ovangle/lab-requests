import { FormArray, FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { LabType } from "../type/lab-type";
import { Injectable } from "@angular/core";
import { ModelService } from "src/app/utils/models/model-service";


export class Equipment {
    readonly id: string;

    name: string;
    description: string;

    availableInLabTypes: LabType[];

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

export interface EquipmentPatch {
    name: string;
    description: string;
    availableInLabTypes: LabType[] | 'all';
    requiresTraining: boolean;
    trainingDescriptions: string[];
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

    override modelFromJson(json: object): Equipment {
        return new Equipment(json);
    }
    override patchToJson(patch: EquipmentPatch): object {
        return patch as object;
    }
}