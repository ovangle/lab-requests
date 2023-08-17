import { Component, Directive, Injectable, Input, ViewChild, inject, ɵbypassSanitizationTrustStyle } from "@angular/core";
import { HAZARDOUS_MATERIAL_CLASSES, HazardClass, classDivision, hazardClassLabelImage } from "./hazardous";
import { MatSelect, MatSelectModule } from "@angular/material/select";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { ControlContainer, ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, NgControl, ReactiveFormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";
/*
@Directive({
    standalone: true,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: NoopValueAccessor,
            multi: true
        }
    ]
})
export class NoopValueAccessor implements ControlValueAccessor {
    writeValue(obj: any): void {
        //throw new Error("Accessed writeValue of NoopValueAccessor");
    }
    registerOnChange(fn: any): void {
        //throw new Error("Accessed registerOnChange of NoopValueAccessor");
    }
    registerOnTouched(fn: any): void {
        //throw new Error("Accessed registerOnTouched of NoopValueAccessor");
    }
}
*/


@Component({
    selector: 'lab-req-hazard-classes-select',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule
    ],
    template: `
    <mat-form-field>
        <mat-label><ng-content select=".label"></ng-content></mat-label>
        <mat-select multiple [formControl]="formControl" (closed)="_onTouched()">
            <mat-optgroup *ngFor="let group of hazardClassGroups" [label]="group.name">
                <mat-option *ngFor="let cls of group.classes" [value]="cls">
                    <div class="hazard-class-label-image">
                        <img alt="" [src]="labelImage(cls)" width="32px" height="32px" />
                    </div>
                    <div class="hazard-class-division">{{_classDivisionLabel(cls)}}</div>

                    <div class="hazard-class-description">{{cls.description}}</div>
                </mat-option>
            </mat-optgroup>
        </mat-select>
    </mat-form-field>
    `,
    styles: [`
    :host {
        display: block;
    }
    mat-form-field {
        width: 100%;
    }

    mat-option ::ng-deep .mdc-list-item__primary-text {
        display: flex;
    }

    .hazard-class-label-image,
    .hazard-class-division,
    .hazard-class-description {

        display: flex;
        align-items: center;
        justify-content: center;
    }

    .hazard-class-division {
        padding: 0 0.4em;
    }
    `],
    providers: [
        { provide: NG_VALUE_ACCESSOR, multi: true, useExisting: HazardClassesSelectComponent }
    ]
})
export class HazardClassesSelectComponent implements ControlValueAccessor {
    readonly hazardClassGroups = HAZARDOUS_MATERIAL_CLASSES;

    readonly formControl = new FormControl<HazardClass[]>([], {nonNullable: true});

    ngOnDestroy() {
        this._onChangeSubscriptions.forEach(s => s.unsubscribe());
    }

    _classDivisionLabel(cls: HazardClass) {
        return classDivision(cls);
    }

    labelImage(cls: HazardClass) {
        return hazardClassLabelImage(cls);
    }


    writeValue(obj: any): void {
        this.formControl.setValue(obj);
    }
    _onChangeSubscriptions: Subscription[] = [];
    registerOnChange(fn: any): void {
        this._onChangeSubscriptions.push(
            this.formControl.valueChanges.subscribe(fn)
        );
    }
    _onTouched = () => {};
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }
    readonly setDisabledState = disabledStateToggler(this.formControl);
}