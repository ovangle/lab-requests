import { Component, Injectable, Input, ViewChild, inject} from "@angular/core";
import { Equipment, EquipmentModelService, EquipmentPatch, EquipmentCreate, isEquipmentPatch, EquipmentContext, EquipmentLookup } from "./equipment";
import { CommonModule } from "@angular/common";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { Observable, defer, delay, filter, map, of, skip, switchMap, switchMapTo, timer, zip } from "rxjs";
import { MatFormFieldModule } from "@angular/material/form-field";
import { AbstractControl, ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LabEquipmentFormComponent } from "./equipment-form.component";
import { MatCardModule } from "@angular/material/card";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";
import { MatInputModule } from "@angular/material/input";
import { ModelCollection, provideFocusedModelContext } from "src/app/utils/models/model-collection";
import { ModelService } from "src/app/utils/models/model-service";
import { EquipmentForm, EquipmentFormService } from "./equipment-form.service";

@Injectable()
export class EquipmentModelCollection extends ModelCollection<Equipment> {
    readonly models = inject(EquipmentModelService);
}


@Component({
    selector: 'lab-equipment-search',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatAutocompleteModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,

        LabEquipmentFormComponent,
    ],
    template: `
    <mat-form-field>
        <mat-label><ng-content select="mat-label"></ng-content></mat-label>

        <input matInput 
            [matAutocomplete]="autocomplete"
            [formControl]="searchControl" />

        <mat-autocomplete #autocomplete 
                          [displayWith]="_displaySearch">
            <ng-container *ngIf="searchOptions$ | async as searchOptions">
                <mat-option *ngFor="let equipment of searchOptions" [value]="equipment">
                    {{equipment.name}} 
                </mat-option>
            </ng-container>

            <mat-option [value]="_NEW_EQUIPMENT_">
                The required equipment was not in this list
            </mat-option>
        </mat-autocomplete>
    </mat-form-field>

    <ng-container *ngIf="isNewEquipment$ | async">
        <mat-card>
            <mat-card-header>Request other equipment</mat-card-header>
            <mat-card-content>
                <lab-equipment-form [form]="form" [committed]="null">
                </lab-equipment-form>
            </mat-card-content>
            <mat-card-footer #createFormControls>
            </mat-card-footer>
        </mat-card>
    </ng-container>
    `,
    providers: [
        EquipmentModelCollection,
        EquipmentContext,
        EquipmentFormService,
        { 
            provide: NG_VALUE_ACCESSOR, 
            multi: true,
            useExisting: EquipmentSearchComponent
        }
    ]
})
export class EquipmentSearchComponent implements ControlValueAccessor {
    readonly _NEW_EQUIPMENT_ = Symbol('_NEW_EQUIPMENT_');

    readonly equipments = inject(EquipmentModelCollection);
    readonly searchControl = new FormControl<Equipment | Symbol | string>(
        '', 
        {
            nonNullable: true,
            validators: [
                (c) => this._validateNewEquipment(c as FormControl<Equipment | Symbol | string>)
            ]
        }
    );

    readonly equipmentContext = inject(EquipmentContext);
    readonly searchOptions$ = defer(() => this.equipments.items$);
    readonly isNewEquipment$ = this.searchControl.valueChanges.pipe(
        map(value => value === this._NEW_EQUIPMENT_)
    );

    readonly _formService = inject(EquipmentFormService);
    get form(): EquipmentForm {
        return this._formService.form;
    }
    
    constructor() {
        this.equipments.connectQuery(this.searchControl.valueChanges.pipe( takeUntilDestroyed(),
            map(searchText => ({ searchText } as EquipmentLookup))
        ));
        this.equipmentContext.initCreateContext();

        // Prepopulate the new input with the value from the search text.
        this.searchControl.valueChanges.pipe(
            filter((v): v is (Equipment | string) => v != this._NEW_EQUIPMENT_),
            map(v => {
                if (typeof v === 'string' || v == null) {
                    return v;
                }
                return v.name;
            }) 
        ).subscribe(
            name => this.form.patchValue({name})
        )
    }

    @ViewChild(LabEquipmentFormComponent, {static: false})
    _labEquipmentForm: LabEquipmentFormComponent | null;

    _validateNewEquipment(searchControl: AbstractControl<Equipment | Symbol | string>): ValidationErrors | null {
        if (searchControl.value === this._NEW_EQUIPMENT_) {
            if (this._labEquipmentForm == null) {
                return { 
                    newEquipmentNotReady: 'Cannot be valid until the created equipment is valid'
                };
            } 
            if (this.form.invalid) {
                return {
                    newEquipmentInvalid: 'The new equipment is invalid',
                }
            }
        }
        return null;
    }

    writeValue(obj: Equipment | EquipmentCreate | string): void {
        if (isEquipmentPatch(obj)) {
            this.searchControl.setValue(this._NEW_EQUIPMENT_);
        } else {
            this.searchControl.setValue(obj);
        }
    }
    
    _onChange = (value: any) => {};
    registerOnChange(fn: any): void {
        this._onChange = fn;
    }
    _onTouched = () => {};
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }

    protected _searchDisabled = disabledStateToggler(this.searchControl);
    setDisabledState(isDisabled: boolean): void {
        this._searchDisabled(isDisabled);

        if (this._labEquipmentForm != null) {
            const form = this._labEquipmentForm.form;
            if (isDisabled && !form.disabled) {
                form.disable();
            }
            if (!isDisabled && form.disabled) {
                form.enable();
            }
        }
    }

    _displaySearch(search: Equipment | EquipmentCreate | string): string {
        if (search instanceof Equipment) {
            return search.name;
        } else if (isEquipmentPatch(search)) {
            return '(new )' + search.name;
        } else {
            return search;
        }
    }
}
