import { CommonModule } from "@angular/common";
import { Component, Input, inject } from "@angular/core";
import { ControlContainer, ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatRadioModule } from "@angular/material/radio";
import { MatSelectModule } from "@angular/material/select";
import { ExperimentalPlanType, PLAN_TYPES } from "./experimental-plan-type";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { combineLatest, firstValueFrom, map, of, startWith, switchMap } from "rxjs";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { SelectOtherDescriptionComponent } from "src/app/utils/forms/select-other-description.component";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";


@Component({
    selector: 'lab-req-experimental-plan-type-select',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatRadioModule,

        SelectOtherDescriptionComponent
    ],
    template: `
    <ng-container [formGroup]="_controlGroup">
        <mat-form-field>
            <mat-label>Funding source</mat-label>
            <mat-select formControlName="selectedType" [required]="required">
                <mat-option *ngFor="let planType of planTypes" [value]="planType">{{planType.description}}</mat-option>
                <mat-option value="other">Other...</mat-option>
            </mat-select>
        </mat-form-field>

        <lab-req-select-other-description
            [isOtherSelected]="isOtherSelected$ | async"
            formControlName="otherDescription">
        </lab-req-select-other-description>
    </ng-container>
    `,
    styles: [`
    :host {
        display: flex;
        flex-direction: row;
    }

    mat-form-field, .other-select-container {
        width: 100%;
    }
    .other-select-container > mat-form-field {
        padding-left: 1em;
        box-sizing: border-box;
    }

    `],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: ExperimentalPlanTypeSelectComponent
        }
    ]
})
export class ExperimentalPlanTypeSelectComponent implements ControlValueAccessor {

    controlContainer = inject(ControlContainer);
    planTypes = PLAN_TYPES;

    @Input()
    get required(): boolean {
        return this._required;
    }
    set required(value: BooleanInput) {
        this._required = coerceBooleanProperty(value);
    }

    private _required = false;

    readonly _controlGroup = new FormGroup({
        selectedType: new FormControl<null | ExperimentalPlanType | 'other'>(null),
        otherDescription: new FormControl<string>('', {nonNullable: true})
    });

    get _selectedTypeControl() { return this._controlGroup.controls.selectedType; }
    get _otherDescriptionControl() { return this._controlGroup.controls.otherDescription; }

    readonly selectedValue$ = this._controlGroup.valueChanges.pipe(
        takeUntilDestroyed(),
        map(({selectedType, otherDescription}) => {
            if (selectedType == null) {
                return null;
            }
            if (selectedType === 'other') {
                return otherDescription ? { description: otherDescription } : null;
            }
            return selectedType;
        })
    )

    readonly isOtherSelected$ = this._controlGroup.valueChanges.pipe(
        takeUntilDestroyed(),
        map(({selectedType}) => selectedType === 'other')
    );

    writeValue(value: any): void {
        if (value == null) {
            return this._selectedTypeControl.setValue(null);
        }
        if (typeof value === 'object') {
            const cannedType = this.planTypes.filter(
                t => t.description === value.description
            )[0];
            if (cannedType) {
                return this._selectedTypeControl.setValue(cannedType);
            }
            this._controlGroup.setValue({
                selectedType: 'other',
                otherDescription: value.description || ''
            })
        } else {
            throw new Error('Received unexpected value for <lab-req-experimental-plan-type>. Expected an object or null')
        }
    }

    registerOnChange(fn: (value: any) => void): void {
        this.selectedValue$.subscribe(fn);
    }
    registerOnTouched(fn: any): void {
        firstValueFrom(this.selectedValue$).then(fn)
    }
    readonly setDisabledState = disabledStateToggler(this._controlGroup);

}