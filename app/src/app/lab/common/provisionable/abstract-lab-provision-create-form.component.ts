import { Directive, EventEmitter, InputSignal, Output, Signal, inject, input } from "@angular/core";
import { AbstractControl, ControlContainer, FormControl, FormGroup, ValidationErrors, ValidatorFn } from "@angular/forms";
import { Lab } from "../../lab";
import { Provisionable, ProvisionableCreateRequest } from "./provisionable";
import { LabProvision, LabProvisionCreateRequest, LabProvisionService } from "./provision";
import { Observable, firstValueFrom } from "rxjs";
import { ResearchFunding } from "src/app/research/funding/research-funding";
import { Model, ModelCreateRequest, ModelRef } from "src/app/common/model/model";
import { UnitOfMeasurement } from "src/app/common/measurement/measurement";
import { format } from "date-fns";
import { A11yModule } from "@angular/cdk/a11y";

export interface LabProvisionCreateFormControls {
    hasCostEstimates: FormControl<boolean>;

    note: FormControl<string>;
}

export function labProvisionCreateFormGroup<
    TControl extends { [ K in keyof TControl ]: AbstractControl<any> }
>(
    controls: TControl,
    options?: {
        defaultFunding?: ResearchFunding | null;
        defaultQuantityRequired: [ number, UnitOfMeasurement ];
        quantityRequiredValidators?: ValidatorFn[]
    }
): FormGroup<TControl & LabProvisionCreateFormControls> {
    return new FormGroup({
        ...controls,
        quantityRequired: new FormControl<[ number, UnitOfMeasurement ]>(
            options?.defaultQuantityRequired || [ 1, 'item' ],
            {
                nonNullable: true,
                validators: options?.quantityRequiredValidators
            }
        ),
        hasCostEstimates: new FormControl<boolean>(false, { nonNullable: true }),

        note: new FormControl<string>('', { nonNullable: true })
    } as TControl & LabProvisionCreateFormControls);
}


export type LabProvisionCreateFormGroup<
    TControl extends { [ K in keyof TControl ]: AbstractControl<any> }
> = FormGroup<TControl & LabProvisionCreateFormControls>;

export function isLabProvisionCreateFormGroup<TControl extends { [ K in keyof TControl ]: AbstractControl<any> }>(
    controlKeys: ReadonlyArray<keyof TControl>,
    obj: unknown,
): obj is LabProvisionCreateFormGroup<TControl> {
    if (!(obj instanceof FormGroup)) {
        return false;
    }
    const keys = Object.keys(obj.controls);
    const hasBaseKeys = [ 'numRequired', 'unit', 'hasCostEstimates' ].every(k => keys.includes(k));

    return hasBaseKeys && controlKeys.every(k => keys.includes(k.toString()));
}

export function labProvisionCreateRequestFromFormValue<
    TProvisionable extends Provisionable<TProvision>,
    TProvision extends LabProvision<TProvisionable>,
    TControl extends { [ K in keyof TControl ]: AbstractControl<any> },
    TType extends TProvision[ 'type' ],
>(
    type: TType,
    target: Model | ModelCreateRequest<any>,
    value: LabProvisionCreateFormGroup<TControl>[ 'value' ],
): LabProvisionCreateRequest<TProvisionable, TProvision> & { readonly type: TType, readonly target: any } {
    return {
        type,
        target,
        // estimatedCost,
        note: value.note
    } as any;
}

@Directive()
export abstract class AbstractLabProvisionCreateFormComponent<
    TProvision extends LabProvision<any>,
    TForm extends LabProvisionCreateFormGroup<any>,
    TRequest extends LabProvisionCreateRequest<any, TProvision>
> {
    readonly _labProvisionService = inject(LabProvisionService<any, TProvision>);

    target = input.required<TRequest[ 'target' ]>();

    @Output()
    readonly save = new EventEmitter<TProvision>();

    protected abstract __isFormGroupInstance(obj: unknown): obj is TForm;
    protected abstract __createStandaloneForm(): TForm;

    protected abstract __createRequestFromFormValue(
        target: TRequest[ 'target' ],
        form: TForm[ 'value' ]
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

    get quantityRequiredErrors(): ValidationErrors | null {
        return this.form.controls[ 'quantityRequired' ].errors;
    }

    async onFormSubmit() {
        if (!this.isStandaloneForm) {
            throw new Error(`Cannot submit a standalone form`);
        }
        if (!this.form.valid) {
            throw new Error(`Cannot submit an invalid form`);
        }
        const request = this.__createRequestFromFormValue(this.target(), this.form.value);
        const provision = await firstValueFrom(
            this._labProvisionService.create(request)
        );
        this.save.emit(provision);
    }

}