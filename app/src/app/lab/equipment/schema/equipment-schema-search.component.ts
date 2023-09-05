import { Component, Input, ViewChild, inject } from "@angular/core";
import { EquipmentSchema, EquipmentSchemaForm, EquipmentSchemaService, createEquipmentSchemaForm, isEquipmentSchemaForm } from "./equipment-schema";
import { CommonModule } from "@angular/common";
import { MatAutocomplete, MatAutocompleteModule, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { ControlValueAccessor, FormControl, FormControlName, FormGroupDirective, NG_VALUE_ACCESSOR, NgControl, ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { BehaviorSubject, filter, map, of, shareReplay, startWith, switchMap } from "rxjs";
import { MatFormFieldModule } from "@angular/material/form-field";
import { EquipmentSchemaFormComponent } from "./equipment-schema-form.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
    selector: 'lab-req-equipment-schema-search',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,

        EquipmentSchemaFormComponent
    ],
    template: `
    <mat-form-field>
        <mat-label>Equipment type</mat-label>
        <input type="text"
            placeholder="Pick one"
            matInput
            [formControl]="searchControl"
            [matAutocomplete]="auto">
    </mat-form-field>

    <mat-autocomplete #auto="matAutocomplete"
        [displayWith]="_displayWithFn"
        (optionSelected)="_onTouched()">

        <ng-container *ngIf="options$ | async as options">
            <mat-option *ngFor="let option of options" [value]="option">
                {{option.name}}
            </mat-option>

            <mat-option [value]="provisionSchemaForm">
                The equipment I need was not listed
            </mat-option>

        </ng-container>
    </mat-autocomplete>

    <ng-container *ngIf="searchControl.value === provisionSchemaForm">
        <lab-req-equipment-schema-form
            [form]="provisionSchemaForm"
            (save)="this.searchControl.setValue($event)">
        </lab-req-equipment-schema-form>
    </ng-container>
    `,
    providers: [
        EquipmentSchemaService,
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: EquipmentSchemaSearchComponent
        }
    ]
})
export class EquipmentSchemaSearchComponent implements ControlValueAccessor {

    readonly schemaService = inject(EquipmentSchemaService);

    @ViewChild(MatAutocompleteTrigger, {static: true})
    _autocomplete: MatAutocompleteTrigger;

    /**
     * Control for the search input.
     */
    readonly searchControl = new FormControl<EquipmentSchema | EquipmentSchemaForm | string>('');

    readonly searchInputText$ = this.searchControl.valueChanges.pipe(
        filter((v): v is string => typeof v === 'string'),
        takeUntilDestroyed()
    );

    /**
     * Control for an equipment to be provisioned in the lab.
     */
    readonly provisionSchemaForm: EquipmentSchemaForm = createEquipmentSchemaForm({});

    readonly isProvisionSchemaFormOpen$ = this.searchControl.valueChanges.pipe(
        takeUntilDestroyed(),
        map((v) => v === this.provisionSchemaForm)
    );

    ngOnInit() {
        // Set the name for the equipment from the search input.
        this.searchInputText$.subscribe(value => {
            console.log('setting equipment name');
            const schemaNameControl = this.provisionSchemaForm.controls.name;
            schemaNameControl.setValue(value)
        });

        this.isProvisionSchemaFormOpen$.subscribe(isOpen => {
            if (isOpen && !this.searchControl.disabled) {
                this.searchControl.disable();
            }
            if (!isOpen && this.searchControl.disabled) {
                this.searchControl.enable();
            }
        });

        this.searchControl.valueChanges.subscribe(value => {
            if (value instanceof EquipmentSchema) {
                this._onChange(value);
            } else if (value === '') {
                this._onChange(null);
            }
       });
    }

    readonly options$ = this.searchControl.valueChanges.pipe(
        startWith(null),
        filter((value): value is EquipmentSchema | null => value != this.provisionSchemaForm),
        switchMap((value: EquipmentSchema | string | null) => {
            if (value && typeof value !== 'string') {
                return of([]);
            }
            return this.schemaService.matchSchemas(value);
        }),
        shareReplay(1)
    );

    _displayWithFn(value: EquipmentSchema | EquipmentSchemaForm | null) {
        if (isEquipmentSchemaForm(value)) {
            return value.value.name || '';
        } else {
            return value ? value.name : '';
        }
    }

    writeValue(obj: EquipmentSchema | null): void {
        this.searchControl.setValue(this._displayWithFn(obj));
    }
    _onChange = (value: EquipmentSchema | string | null) => {};
    registerOnChange(fn: any): void {
        this._onChange = fn;
    }
    _onTouched = () => {};
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }

}