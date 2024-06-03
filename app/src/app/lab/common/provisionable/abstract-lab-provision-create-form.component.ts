import { Directive, EventEmitter, InputSignal, Output, Signal, inject, input } from "@angular/core";
import { AbstractControl, ControlContainer, FormControl, FormGroup } from "@angular/forms";
import { Lab } from "../../lab";
import { inputMaterialFromJson } from "../../lab-resource/types/input-material/input-material";
import { Provisionable, ProvisionableCreateRequest } from "./provisionable";
import { LabProvision, LabProvisionCreateRequest, LabProvisionService } from "./provision";
import { LabSoftwareRequestFormComponent } from "../../lab-software/software-request-form.component";
import { Observable, firstValueFrom } from "rxjs";
import { CostEstimateFormGroup, costEstimateFormGroup, costEstimateFromFormValue } from "src/app/research/funding/cost-estimate/cost-estimate-form.component";
import { ResearchFunding } from "src/app/research/funding/research-funding";
import { CostEstimate } from "src/app/research/funding/cost-estimate/cost-estimate";
import { ModelRef } from "src/app/common/model/model";
import { UnitOfMeasurement } from "src/app/common/measurement/measurement";
import { format } from "date-fns";
import { A11yModule } from "@angular/cdk/a11y";

export interface LabProvisionCreateFormControls {
    numRequired: FormControl<number>;
    unit: FormControl<UnitOfMeasurement>;

    hasCostEstimates: FormControl<boolean>;
    estimatedCost?: CostEstimateFormGroup;
}

export function labProvisionCreateFormGroup<
    TControl extends { [K in keyof TControl]: AbstractControl<any> }
>(
    controls: TControl,
    options?: {
        defaultFunding?: ResearchFunding | null;
        defaultNumRequired: number;
        defaultUnitOfMeasurement: UnitOfMeasurement;
    }
): FormGroup<TControl & LabProvisionCreateFormControls> {
    return new FormGroup({
        ...controls,
        numRequired: new FormControl<number>(
            options?.defaultNumRequired || 1,
            { nonNullable: true }
        ),
        unit: new FormControl<UnitOfMeasurement>(
            options?.defaultUnitOfMeasurement || 'item',
            { nonNullable: true }
        ),
        hasCostEstimates: new FormControl<boolean>(false, { nonNullable: true }),
        estimatedCost: costEstimateFormGroup(options?.defaultFunding),
    } as TControl & LabProvisionCreateFormControls);
}


export type LabProvisionCreateFormGroup<
    TControl extends { [K in keyof TControl]: AbstractControl<any> }
> = FormGroup<TControl & LabProvisionCreateFormControls>;

export function labProvisionCreateRequestFromFormValue<
    TProvisionable extends Provisionable<TProvision>,
    TProvision extends LabProvision<TProvisionable>,
    TControl extends { [K in keyof TControl]: AbstractControl<any> },
    TType extends TProvision['type'],
    TTarget extends ModelRef<TProvisionable> | ProvisionableCreateRequest<TProvisionable>
>(
    type: TType,
    target: TTarget,
    value: LabProvisionCreateFormGroup<TControl>['value'],
): LabProvisionCreateRequest<TProvisionable, TProvision> & { readonly type: TType, readonly target: TTarget } {
    let numRequired = value.numRequired!;
    let unit = value.unit!;

    let estimatedCost: CostEstimate | null;
    if (value.hasCostEstimates) {
        estimatedCost = costEstimateFromFormValue(value.estimatedCost!, {
            quantityRequired: [numRequired, unit]
        });
    } else {
        estimatedCost = null;
    }

    return {
        type,
        target,
        unit,
        numRequired,
        estimatedCost,
    };
}

@Directive()
export abstract class AbstractLabProvisionCreateFormComponent<
    TProvision extends LabProvision<any>,
    TForm extends LabProvisionCreateFormGroup<any>,
    TRequest extends LabProvisionCreateRequest<any, TProvision>
> {
    readonly _labProvisionService = inject(LabProvisionService<any, TProvision>);

    target = input.required<TRequest['target']>();

    @Output()
    readonly save = new EventEmitter<TProvision>();

    protected abstract __isFormGroupInstance(obj: unknown): obj is TForm;
    protected abstract __createStandaloneForm(): TForm;

    protected abstract __createRequestFromFormValue(
        target: TRequest['target'],
        form: TForm['value']
    ): TRequest;

    _controlContainer = inject(ControlContainer, { optional: true });
    _standaloneForm: TForm | undefined;

    get isStandaloneForm() { return this._standaloneForm === undefined; }
    get form(): TForm {
        if (this.__isFormGroupInstance(this._controlContainer?.control)) {
            if (this._standaloneForm !== undefined) {
                throw new Error('form accessed before initialization');
            }
            return this._controlContainer.control;
        }
        if (this._standaloneForm === undefined) {
            this._standaloneForm = this.__createStandaloneForm();
        }
        return this._standaloneForm;
    }

    async onFormSubmit() {
        if (!this.isStandaloneForm) {
            throw new Error(`Cannot submit a standalone form`);
        }
        if (!this.form.valid) {
            throw new Error(`Cannot submit an invalid form`);
        }
        const request = this.__createRequestFromFormValue(this.form.value);
        const provision = await firstValueFrom(
            this._labProvisionService.create(request)
        );
        this.save.emit(provision);
    }

}