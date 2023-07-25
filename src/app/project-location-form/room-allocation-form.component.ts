import { NumberInput, coerceNumberProperty } from "@angular/cdk/coercion";
import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

export interface RoomAllocation {
    name: string;
    /** The space required (in m^2) to carry out expirimental plan */
    spaceEstimate: number;
}

export type RoomAllocationForm = FormGroup<{
    [K in keyof RoomAllocation]: FormControl<RoomAllocation[K]>
}>

export function createRoomAllocationForm() {
    return new FormGroup({
        name: new FormControl('', {nonNullable: true}),
        spaceEstimate: new FormControl(0, {nonNullable: true})
    });
}

@Component({
    selector: 'lab-req-room-allocation-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatCardModule,
        MatInputModule,
        MatFormFieldModule,
    ],
    template: `
        <mat-card [formGroup]="formGroup">
            <mat-card-content>
            <mat-form-field>
                <mat-label>Room number</mat-label>

                <input matInput type="text"
                       id="location-{{locationIndex}}-room-{{roomIndex}}-name"
                       formControlName="name" />
            </mat-form-field>

            <mat-form-field>
                <mat-label>Estimated space required (m<sup>2</sup>)</mat-label>
                <input matInput type="number"
                       id="location-{{locationIndex}}-space-estimate"
                       formControlName="spaceEstimate" />
                </mat-form-field>
            </mat-card-content>
        </mat-card>
    `
})
export class RoomAllocationFormComponent {
    @Input()
    form: AbstractControl<any, any>;

    @Input()
    get locationIndex(): number {
        return this._locationIndex;
    }
    set locationIndex(value: NumberInput) {
        this._locationIndex = coerceNumberProperty(value);
    }
    _locationIndex: number;

    @Input()
    get roomIndex(): number {
        return this._roomIndex;
    }
    set roomIndex(value: NumberInput) {
        this._roomIndex = coerceNumberProperty(value);
    }
    private _roomIndex: number;

    get formGroup(): RoomAllocationForm {
        if (!(this.form instanceof FormGroup)) {
            throw new Error('Expected room allocation form group');
        }
        return this.form;
    }
}