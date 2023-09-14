import { Component, Input, ViewChild, inject} from "@angular/core";
import { Equipment, EquipmentModelService, EquipmentPatch } from "./equipment";
import { CommonModule } from "@angular/common";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { Observable, delay, map, of, switchMap, switchMapTo, timer } from "rxjs";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { LabEquipmentFormComponent } from "./equipment-patch.form";
import { MatCardModule } from "@angular/material/card";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";
import { MatInputModule } from "@angular/material/input";

@Component({
    selector: 'app-lab-equipment-search-option',
    standalone: true,
    template: `
    {{equipment.name}}
    `
})
export class LabEquipmentSearchOptionComponent {
    @Input() equipment: Equipment;
}


@Component({
    selector: 'app-lab-equipment-search',
    standalone: true,
    imports: [
        CommonModule,

        MatAutocompleteModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,

        LabEquipmentFormComponent,
        LabEquipmentSearchOptionComponent
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
                    <app-lab-equipment-search-option [equipment]="equipment">
                    </app-lab-equipment-search-option>
                </mat-option>
            </ng-container>

            <mat-option [value]="_newEquipmentSentinel">
                The required equipment was not in this list
            </mat-option>
        </mat-autocomplete>
    </mat-form-field>

    <ng-container *ngIf="isNewEquipmentSelected">
        <mat-card>
            <mat-card-header>Request other equipment</mat-card-header>
            <mat-card-content>
                <app-lab-equipment-form></app-lab-equipment-form>
            </mat-card-content>
            <mat-card-footer #createFormControls>
            </mat-card-footer>
        </mat-card>
    </ng-container>
    `,
    providers: [
        { 
            provide: NG_VALUE_ACCESSOR, 
            multi: true,
            useExisting: LabEquipmentSearchComponent
        }
    ]
})
export class LabEquipmentSearchComponent implements ControlValueAccessor {
    readonly _newEquipmentSentinel = Symbol('NEW_EQUIPMENT');
    
    readonly modelService = inject(EquipmentModelService);

    readonly searchControl = new FormControl<Equipment | Symbol | string>('', {nonNullable: true});

    readonly searchOptions$ = this.searchControl.valueChanges.pipe(
        takeUntilDestroyed(),
        switchMap(searchValue => {
            return this.modelService.query({nameStartsWith: searchValue});
        })
    );

    get isNewEquipmentSelected() {
        return this.searchControl.value === this._newEquipmentSentinel;
    }

    @ViewChild(LabEquipmentFormComponent, { static: false })
    labEquipmentForm?: LabEquipmentFormComponent;

    readonly selectedValue$: Observable<Equipment | EquipmentPatch | null> = this.searchControl.valueChanges.pipe(
        takeUntilDestroyed(),
        switchMap((value): Observable<Equipment | EquipmentPatch | string | null> => {
            if (value === this._newEquipmentSentinel) { 
                // Delay for one tick to ensure labEquipmentForm view child is available.
                return timer(0).pipe(switchMap(() => this.labEquipmentForm!.patchValue$));
            }
            return of(value as Equipment | string);
        }),
        map(value => typeof value === 'string' ? null : value)
    );

    _displaySearch(value: any) {
        if (value instanceof Equipment) {
            return value.name;
        }
        if (value === this._newEquipmentSentinel) {
            return 'Requesting new equipment...'
        }
        return value;
    }

    writeValue(obj: any): void {
        if (obj instanceof Equipment || typeof obj === 'string') {
            this.searchControl.setValue(obj);
        }
        throw new Error('Cannot set search value')
    }
    _onChange = (value: any) => {};
    registerOnChange(fn: any): void {
        this._onChange = fn;
    }
    _onTouched = () => {}
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }
    setDisabledState = disabledStateToggler(this.searchControl);
}
