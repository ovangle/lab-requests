import { FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { Material } from "../material";
import { HazardClass } from "../../common/hazardous/hazardous";
import { ResourceStorage, ResourceStorageForm, createResourceStorageForm, isResourceStorageType } from "../../common/storage/resource-storage";
import { ResourceStorageFormComponent } from "../../common/storage/resource-storage-form.component";
import { numberAttribute } from "@angular/core";
import { HazardClassLabelsComponent } from "../../common/hazardous/hazard-classes-labels.component";

export class InputMaterial extends Material {
    override readonly type = 'input-material';

    name: string;
    baseUnit: string;

    numUnitsRequired: number;

    isUniversitySupplied: boolean;
    /** The estimated cost per base unit */
    estimatedCost: number;

    storage: ResourceStorage;
    hazardClasses: HazardClass[];

    constructor(input: { name: string; baseUnit: string } & Partial<InputMaterial>) {
        super();
        this.name = input.name;
        this.baseUnit = input.baseUnit;

        this.numUnitsRequired = input.numUnitsRequired || 0;

        this.isUniversitySupplied = !!input?.isUniversitySupplied;
        this.estimatedCost = input?.estimatedCost || 0;

        this.storage = new ResourceStorage(
            isResourceStorageType(input.storage?.type)
            ? new ResourceStorage(input.storage!)
            : {type: 'general'}
        );


        this.hazardClasses = input?.hazardClasses || [];
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
            input.isUniversitySupplied || false, {nonNullable: true}
        ),
        estimatedCost: new FormControl<number>(
            input.estimatedCost || 0,
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