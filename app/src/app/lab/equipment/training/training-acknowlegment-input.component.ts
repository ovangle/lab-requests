import { Component, Input } from "@angular/core";
import { ControlValueAccessor, FormArray, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { CommonModule, formatNumber } from "@angular/common";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { EquipmentTrainingDescriptionsInfoComponent } from "./training-descriptions-info.component";
import { Subscription } from "rxjs";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";
import { MatCardModule } from "@angular/material/card";
import { MatListModule } from "@angular/material/list";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";


@Component({
    selector: 'lab-equipment-training-acknowledgement-input',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatCheckboxModule,
        MatListModule,

        EquipmentTrainingDescriptionsInfoComponent
    ],
    template: `
    <mat-card [class.readonly]="readonly">
        <mat-card-header>
            Required Training
        </mat-card-header>

        <mat-card-content>
            <mat-selection-list [formControl]="selectedControl">
                <mat-list-item *ngFor="let description of descriptions">
                    {{description}}
                </mat-list-item>
            </mat-selection-list>
        </mat-card-content>

        <mat-card-footer>
            <ng-content select=".controls"></ng-content>
        </mat-card-footer>
    </mat-card>
   `,
    styles: [`
    .readonly {
        background-color: cream;
    }
    `],
    providers: [
        { 
            provide: NG_VALUE_ACCESSOR, 
            multi: true,
            useExisting: EquipmentTrainingAcknowlegementComponent
        }
    ]
})
export class EquipmentTrainingAcknowlegementComponent implements ControlValueAccessor {
    @Input({required: true})
    descriptions: string[];

    @Input()
    readonly: boolean = false;
    
    readonly selectedControl = new FormControl<string[]>([], {nonNullable: true});

    constructor() {
        this.selectedControl.valueChanges.pipe(
            takeUntilDestroyed(),
        ).subscribe((v) => this._onChange(v)); 
    }

    _isDisabled: boolean;

    _subscriptions: Subscription[] = [];

    ngOnDestroy() {
        this._subscriptions.forEach(s => s.unsubscribe());
    }

    writeValue(value: string[]): void { 
        this.selectedControl.setValue(value);
    }
    _onChange = (value: string[]) => {};
    registerOnChange(fn: any): void {
        this._onChange = fn;
    }
    _onTouched = () => {}
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }
    setDisabledState(isDisabled: boolean): void {
        this._isDisabled = isDisabled; 
    }
}