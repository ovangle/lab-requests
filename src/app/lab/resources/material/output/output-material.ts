import { FormControl, FormGroup, Validators } from "@angular/forms";
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

    storage: ResourceStorage | null;
    disposal: ResourceDisposal | null;

    hazardClasses: HazardClass[];

    constructor(input: { name: string; baseUnit: string} & Partial<OutputMaterial>) {
        super();

        this.name = input.name
        this.baseUnit = input.baseUnit;

        this.numUnitsProduced = input.numUnitsProduced || 0;

        this.storage = isResourceStorageType(input.storage?.type)
            ? new ResourceStorage(input.storage!)
            : null;

        this.disposal = isResourceDisposalType(input.disposal?.type)
            ? new ResourceDisposal(input.disposal!)
            : null;

        this.hazardClasses = input?.hazardClasses || [];
    }
}

export type OutputMaterialForm = FormGroup<{
    name: FormControl<string>;
    baseUnit: FormControl<string>;
    numUnitsProduced: FormControl<number>;

    storage: ResourceStorageForm;
    disposal: ResourceDisposalForm;
    hazardClasses: FormControl<HazardClass[]>;
}>;

export function createOutputMaterialForm(output: Partial<OutputMaterial>): OutputMaterialForm {
    return new FormGroup({
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
