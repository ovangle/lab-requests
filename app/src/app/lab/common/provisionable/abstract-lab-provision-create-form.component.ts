import { Directive, EventEmitter, InputSignal, inject } from "@angular/core";
import { AbstractControl, FormControl, FormGroup } from "@angular/forms";
import { Lab } from "../../lab";
import { inputMaterialFromJson } from "../../lab-resource/types/input-material/input-material";
import { Provisionable } from "./provisionable";
import { LabProvision, LabProvisionCreateRequest, LabProvisionService } from "./provision";
import { LabSoftwareRequestFormComponent } from "../../lab-software/software-request-form.component";
import { firstValueFrom } from "rxjs";

export interface LabProvisionCreateFormControls {
    quantityRequired: FormControl<number>;
}

export function labProvisionCreateFormGroup<
    TControl extends { [K in keyof TControl]: AbstractControl<any> }
>(
    controls: TControl
): FormGroup<TControl & LabProvisionCreateFormControls> {
    return new FormGroup({
        quantityRequired: new FormControl(1, { nonNullable: true }),
        ...controls
    })
}

export type LabProvisionCreateFormGroup<
    TControl extends { [K in keyof TControl]: AbstractControl<any> }
> = FormGroup<TControl & LabProvisionCreateFormControls>;

@Directive()
export abstract class AbstractLabProvisionCreateFormComponent<
    TProvisionable extends Provisionable<any>,
    TProvision extends LabProvision<TProvisionable>,
    TForm extends LabProvisionCreateFormGroup<any>
> {
    readonly _labProvisionService = inject(LabProvisionService<TProvisionable, TProvision>);
    abstract readonly form: TForm;
    abstract readonly isStandaloneForm: boolean;

    readonly save = new EventEmitter<TProvision>();

    abstract createRequestFromForm(form: TForm): LabProvisionCreateRequest<TProvisionable, TProvision>;

    async onFormSubmit() {
        if (!this.isStandaloneForm) {

            throw new Error(`Cannot submit a standalone form`);
        }
        if (!this.form.valid) {
            throw new Error(`Invalid form has no value`);
        }
        const request = this.createRequestFromForm(this.form);
        const provision = await firstValueFrom(
            this._labProvisionService.create(request)
        );
        this.save.emit(provision);

    }

}