import { FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { Material } from "../material";
import { HazardClass, hazardClassesFromJson, hazardClassesToJson } from "../../common/hazardous/hazardous";
import { ResourceStorage, ResourceStorageForm, createResourceStorageForm, isResourceStorageType, resourceStorageFromJson, resourceStorageToJson } from "../../common/storage/resource-storage";
import { CostEstimate, costEstimateFromJson, costEstimateToJson } from "../../common/resource";

export class InputMaterial extends Material {
    override readonly type = 'input-material';

    name: string;
    baseUnit: string;

    numUnitsRequired: number;

    perUnitCostEstimate: CostEstimate | null; 

    storage: ResourceStorage;
    hazardClasses: HazardClass[];

    constructor(input: { name: string; baseUnit: string } & Partial<InputMaterial>) {
        super();
        this.name = input.name;
        this.baseUnit = input.baseUnit;

        this.numUnitsRequired = input.numUnitsRequired || 0;

        this.perUnitCostEstimate = input.perUnitCostEstimate || null;

        this.storage = new ResourceStorage(
            isResourceStorageType(input.storage?.type)
            ? new ResourceStorage(input.storage!)
            : {type: 'general'}
        );


        this.hazardClasses = input?.hazardClasses || [];
    }
}

export function inputMaterialFromJson(json: {[k: string]: any}): InputMaterial {
    return new InputMaterial({
        name: json['name'],
        baseUnit: json['baseUnit'],
        numUnitsRequired: json['numUnitsRequired'],
        perUnitCostEstimate: json['perUnitCostEstimate'] ? costEstimateFromJson(json['perUnitCostEstimate']) : null,
        storage: resourceStorageFromJson(json['storage']),
        hazardClasses: hazardClassesFromJson(json['hazardClasses'])
    })
}


export function inputMaterialToJson(inputMaterial: InputMaterial): {[k: string]: any} {
    return {
        name: inputMaterial.name,
        baseUnit: inputMaterial.baseUnit,
        numUnitsRequired: inputMaterial.numUnitsRequired,
        perUnitCostEstimate: inputMaterial.perUnitCostEstimate && costEstimateToJson(inputMaterial.perUnitCostEstimate),
        storage: resourceStorageToJson(inputMaterial.storage),
        hazardClasses: hazardClassesToJson(inputMaterial.hazardClasses)
    }
}

export type InputMaterialForm = FormGroup<{
    type: FormControl<'input-material'>;
    name: FormControl<string>;
    baseUnit: FormControl<string>;

    numUnitsRequired: FormControl<number>;

    storage: ResourceStorageForm;
    hazardClasses: FormControl<HazardClass[]>;

    isUniversitySupplied: FormControl<boolean>;
    estimatedCost: FormControl<number>;
}>;

export function createInputMaterialForm(input: Partial<InputMaterial>): InputMaterialForm {
    return new FormGroup({
        type: new FormControl('input-material', {nonNullable: true}),
        name: new FormControl<string>(
            input.name || '',
            {nonNullable: true, validators: [Validators.required]}
        ),
        baseUnit: new FormControl<string>(
            input.baseUnit || '',
            {nonNullable: true, validators: [Validators.required]}
        ),
        numUnitsRequired: new FormControl<number>(
            input.numUnitsRequired || 0,
            {nonNullable: true}
        ),
        isUniversitySupplied: new FormControl<boolean>(
            input.perUnitCostEstimate?.isUniversitySupplied || false, {nonNullable: true}
        ),
        estimatedCost: new FormControl<number>(
            input.perUnitCostEstimate?.estimatedCost || 0,
            {nonNullable: true}
        ),
        storage: createResourceStorageForm(
            input.storage || {}
        ),
        hazardClasses: new FormControl<HazardClass[]>(input.hazardClasses || [], {nonNullable: true})
    });
}

export type InputMaterialFormErrors = ValidationErrors & {
    name?: { required: string | null };
    baseUnit?: {required: string | null };
};