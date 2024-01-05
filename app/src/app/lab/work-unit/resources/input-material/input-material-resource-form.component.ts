import { CommonModule } from "@angular/common";
import { Component, ViewChild, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { InputMaterial } from "./input-material";
import { ResourceFormService } from "../../resource/resource-form.service";
import { HazardClassesSelectComponent } from "../../resource/hazardous/hazard-classes-select.component";
import { ProvisionFormComponent } from "../../resource/provision/provision-form.component";
import { ResourceStorageForm, ResourceStorageFormComponent, resourceStorageForm } from "../../resource/storage/resource-storage-form.component";
import { CommonMeasurementUnitInputComponent } from "src/app/common/measurement/common-measurement-unit-input.component";
import { MeasurementUnitPipe } from "src/app/common/measurement/common-measurement-unit.pipe";
import { CostEstimateForm, CostEstimateFormComponent, costEstimateForm } from "src/app/uni/research/funding/cost-estimate/cost-estimate-form.component";
import { HazardClass } from "../../resource/hazardous/hazardous";
import { FundingModel } from "src/app/uni/research/funding/funding-model";
import { ExperimentalPlanContext } from "src/app/lab/experimental-plan/common/experimental-plan";
import { BehaviorSubject, Observable, map } from "rxjs";
import { WorkUnitContext } from "../../common/work-unit";


export type InputMaterialForm = FormGroup<{
    name: FormControl<string>;
    description: FormControl<string>;
    baseUnit: FormControl<string>;

    numUnitsRequired: FormControl<number>;

    storage: ResourceStorageForm;
    hazardClasses: FormControl<HazardClass[]>;

    perUnitCostEstimate: CostEstimateForm;
}>;

export function inputMaterialForm(): InputMaterialForm {
    return new FormGroup({
        name: new FormControl<string>(
            '',
            { nonNullable: true, validators: [ Validators.required ] }
        ),
        description: new FormControl<string>(
            '',
            { nonNullable: true }
        ),
        baseUnit: new FormControl<string>(
            '',
            { nonNullable: true, validators: [ Validators.required ] }
        ),
        numUnitsRequired: new FormControl<number>(
            0,
            { nonNullable: true }
        ),
        perUnitCostEstimate: costEstimateForm(),
        storage: resourceStorageForm(),
        hazardClasses: new FormControl<HazardClass[]>([], { nonNullable: true })
    });
}

export type InputMaterialFormErrors = ValidationErrors & {
    name?: { required: string | null };
    baseUnit?: { required: string | null };
};

@Component({
    selector: 'lab-input-material-resource-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatInputModule,

        MeasurementUnitPipe,
        CommonMeasurementUnitInputComponent,

        CostEstimateFormComponent,
        HazardClassesSelectComponent,
        ResourceStorageFormComponent,
        ProvisionFormComponent,
    ],
    template: `
    <form [formGroup]="form">
        <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput formControlName="name">

            @if (nameErrors?. required) {
                <mat-error>A value is required</mat-error>
            }
        </mat-form-field>

        <mat-form-field>
            <mat-label>Usage description</mat-label>
            <textarea matInput formControlName="description"></textarea>
        </mat-form-field>

        <common-measurement-unit-input
            formControlName="baseUnit" 
            required>
            <mat-label>Units</mat-label>
        </common-measurement-unit-input>

        @if (fundingModel) {
            <uni-research-funding-cost-estimate-form
                [form]="form.controls.perUnitCostEstimate"
                [funding]="fundingModel" 
                [unitOfMeasurement]="baseUnit" />
        }

        <lab-resource-storage-form 
                [form]="form.controls.storage" 
                [funding]="fundingModel"
                [storageStartDate]="startDate"
                [storageEndDate]="endDate" />

        <lab-req-hazard-classes-select formControlName="hazardClasses">
            <span class="label">Hazard classes</span>
        </lab-req-hazard-classes-select>
    </form>
    `,
    styles: [ `
    form {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }
    `],
})
export class InputMaterialResourceFormComponent {
    readonly _planContext = inject(ExperimentalPlanContext);
    readonly _workUnitContext = inject(WorkUnitContext);
    readonly formService = inject(ResourceFormService<InputMaterial, InputMaterialForm>);

    get resourceType() {
        return this.formService.resourceType;
    }

    get form(): InputMaterialForm {
        return this.formService.form;
    }

    ngOnInit() {
        this.form.statusChanges.subscribe(status => {
            for (const [ key, control ] of Object.entries(this.form.controls)) {
                console.log(key, control.valid, control.errors);
            }
            console.log('status', status);
        })

        this._planContext.plan$.subscribe(plan => {
            this._fundingModelSubject.next(plan.fundingModel);
        })

        this._workUnitContext.workUnit$.subscribe(workUnit => {
            this._durationSubject.next({ startDate: workUnit.startDate, endDate: workUnit.endDate });
        })
    }

    ngOnDestroy() {
        this._fundingModelSubject.complete();
        this._durationSubject.complete();
    }

    get baseUnit(): string {
        return this.form.value?.baseUnit || '';
    }

    get nameErrors(): InputMaterialFormErrors[ 'name' ] | null {
        const control = this.form.controls.name;
        return control.errors as InputMaterialFormErrors[ 'name' ] | null;
    }

    readonly _fundingModelSubject = new BehaviorSubject<FundingModel | null>(null);
    get fundingModel(): FundingModel | null {
        return this._fundingModelSubject.value;
    }

    readonly _durationSubject = new BehaviorSubject<{ startDate: Date | null; endDate: Date | null }>({ startDate: null, endDate: null });
    get startDate(): Date | null {
        return this._durationSubject.value.startDate;
    }
    get endDate(): Date | null {
        return this._durationSubject.value.endDate;
    }

}