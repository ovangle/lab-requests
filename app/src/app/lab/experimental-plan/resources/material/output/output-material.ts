import { FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { Material } from "../material";
import { Resource } from "../../common/resource";
import { ResourceStorage, ResourceStorageForm, createResourceStorageForm, isResourceStorageType } from "../../common/storage/resource-storage";
import { HazardClass } from "../../common/hazardous/hazardous";
import { ResourceDisposal, ResourceDisposalForm, createResourceDisposalForm, isResourceDisposalType } from "../../common/disposal/resource-disposal";
import { groupDisabledStateToggler } from "src/app/utils/forms/disable-state-toggler";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Subscription, map, tap } from "rxjs";

export class OutputMaterial extends Material {
    override readonly type = 'output-material';

    name: string;
    baseUnit: string;

    numUnitsProduced: number;

    storage: ResourceStorage;
    disposal: ResourceDisposal;

    hazardClasses: HazardClass[];

    constructor(input: { name: string; baseUnit: string} & Partial<OutputMaterial>) {
        super();

        this.name = input.name
        this.baseUnit = input.baseUnit;

        this.numUnitsProduced = input.numUnitsProduced || 0;

        this.storage = new ResourceStorage(
            isResourceStorageType(input.storage?.type)
            ? input.storage!
            : {}
        );

        this.disposal = new ResourceDisposal(
            isResourceDisposalType(input.disposal?.type)
            ? new ResourceDisposal(input.disposal!)
            : {}
        );

        this.hazardClasses = input?.hazardClasses || [];
    }
}

export type OutputMaterialForm = FormGroup<{
    type: FormControl<'output-material'>;
    name: FormControl<string>;
    baseUnit: FormControl<string>;
    numUnitsProduced: FormControl<number>;

    storage: ResourceStorageForm;
    disposal: ResourceDisposalForm;
    hazardClasses: FormControl<HazardClass[]>;
}>;

export function createOutputMaterialForm(output: Partial<OutputMaterial>): OutputMaterialForm {
    return new FormGroup({
        type: new FormControl('output-material', {nonNullable: true}),
        name: new FormControl(
            output.name || '',
            {nonNullable: true, validators: [Validators.required]}
        ),
        baseUnit: new FormControl(
            output.baseUnit || '',
            { nonNullable: true, validators: [Validators.required]}
        ),
        numUnitsProduced: new FormControl(
            output.numUnitsProduced || 0,
            { nonNullable: true }
        ),

        storage: createResourceStorageForm(output.storage || {}),
        disposal: createResourceDisposalForm(output.disposal || {}),

        hazardClasses: new FormControl<HazardClass[]>(
            output.hazardClasses || [],
            {nonNullable: true}
        )
    });
}

export function disableDependentControlsWithBaseUnitValidity(outputMaterialForm: OutputMaterialForm): Subscription {
    const toggler = groupDisabledStateToggler(
        outputMaterialForm,
        ['numUnitsProduced', 'storage', 'disposal', 'hazardClasses']
    );

    return outputMaterialForm.valueChanges.pipe(
        takeUntilDestroyed(),
        map(value => {
            const baseUnit = value.baseUnit;
            return baseUnit != '';
        }),
    ).subscribe(toggler);
}

export type OutputMaterialFormErrors = ValidationErrors & {
    name?: { required: string | null; };
    baseUnit?: {required: string | null; };
}