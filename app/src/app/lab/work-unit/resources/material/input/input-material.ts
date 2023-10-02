import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { Material } from "../material";
import { ResourceParams } from "../../../resource/resource";
import { HazardClass, hazardClassesFromJson, hazardClassesToJson } from "../../../resource/hazardous/hazardous";
import { ResourceStorage, ResourceStorageForm, createResourceStorageForm, isResourceStorageType, resourceStorageFromJson, resourceStorageToJson } from "../../../resource/storage/resource-storage";
import { CostEstimate, costEstimateForm, costEstimateFromJson, costEstimateToJson } from "src/app/uni/research/funding/cost-estimate/coste-estimate";

export interface InputMaterialParams extends ResourceParams<InputMaterial> {}

export class InputMaterial extends Material {
    override readonly type = 'input-material';
    override readonly planId: string;
    override readonly workUnitId: string;
    override readonly index: number | 'create';

    name: string;
    baseUnit: string;

    numUnitsRequired: number;

    perUnitCostEstimate: CostEstimate | null; 

    storage: ResourceStorage;
    hazardClasses: HazardClass[];

    constructor(input: InputMaterialParams) {
        super();
        this.planId = input.planId;
        this.workUnitId = input.workUnitId;
        this.index = input.index!;

        if (!input.name) {
            throw new Error('Invalid InputMaterial. Must provide name')
        }

        this.name = input.name;
        if (!input.baseUnit) {
            throw new Error('Invalid InputMaterial. Must provide base units');
        }
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
        planId: json['planId'],
        workUnitId: json['workUnitId'],
        index: json['index'],
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
        planId: inputMaterial.planId,
        workUnitId: inputMaterial.workUnitId,
        index: inputMaterial.index,
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

    perUnitCostEstimate: AbstractControl<CostEstimate | null>
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
        perUnitCostEstimate: costEstimateForm(
            input?.perUnitCostEstimate || undefined
        ) as AbstractControl<CostEstimate | null>,
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