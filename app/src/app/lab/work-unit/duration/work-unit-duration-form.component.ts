import { Component, Input } from "@angular/core";
import { AbstractControl, FormControl, FormGroup } from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";


interface DurationControls {
    startDate: FormControl<Date | null>;
    endDate: FormControl<Date | null>;
}

export type DurationForm<T extends DurationControls> = FormGroup<T & {[k in keyof T]: AbstractControl<any, any>}>;

@Component({
    selector: 'lab-work-unit-duration-form',
    standalone: true,
    imports: [
        CommonModule,
        MatDatepickerModule,
        MatFormFieldModule
    ],
    template: `
    <mat-form-field>
        <mat-label>Duration</mat-label>

        <mat-date-range-input [rangePicker]="picker">
            <input matStartDate placeholder="Start" />
            <input matEndDate placeholder="End" />
        </mat-date-range-input>

        <mat-hint>MM/DD/YYYY - MM/DD/YYYY</mat-hint>

        <mat-datepicker-toggle matIconSuffix [for]="picker" />
        <mat-date-range-picker #picker />
    </mat-form-field>
    `
})
export class WorkUnitDurationFormComponent<T extends DurationControls> {
    @Input({required: true})
    form: DurationForm<T>;
}