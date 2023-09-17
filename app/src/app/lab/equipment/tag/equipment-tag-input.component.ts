import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { MatChipEditedEvent, MatChipInputEvent, MatChipsModule } from "@angular/material/chips";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";

interface EquipmentTag {
    name: string;
}

@Component({
    selector: 'lab-equipment-tags-input',
    standalone: true,
    imports: [
        CommonModule,
        MatFormFieldModule,
        MatIconModule,
        MatChipsModule
    ],
    template: `
    <mat-form-field>
        <mat-label><ng-content select="mat-label"></ng-content></mat-label>

        <mat-chip-grid #chipGrid>
            <mat-chip-row *ngFor="let tag of tags"
                           (removed)="remove(tag)"
                           [editable]="true"
                           (edited)="edit(tag, $event)">
                {{tag.name}}
                <button matChipRemove>
                    <mat-icon>cancel</mat-icon>
                </button>
            </mat-chip-row>


            <input placeholder="New tag..." 
                [matChipInputFor]="chipGrid"
                [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
                matChipInputAddOnBlur
                (matChipInputTokenEnd)="add($event)" />
        </mat-chip-grid>
    </mat-form-field>
    `,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: EquipmentTagInputComponent
        }
    ]
})
export class EquipmentTagInputComponent implements ControlValueAccessor {
    readonly separatorKeysCodes = [ENTER, COMMA] as const;


    tags: EquipmentTag[] = [];
    

    add(event: MatChipInputEvent) {
        const name = event.value.trim().toLowerCase();

        if (name) {
            this.tags.push({name});
        }
    }

    remove(tag: EquipmentTag) {

    }

    edit(tag: EquipmentTag, evt: MatChipEditedEvent) {

    }

    writeValue(obj: EquipmentTag[]): void {
        throw new Error("Method not implemented.");
    }
    _onChange = (value: EquipmentTag) => {}
    registerOnChange(fn: any): void {
        this._onChange = fn;
    }
    _onTouched = () => {}
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }
    setDisabledState?(isDisabled: boolean): void {
        throw new Error("Method not implemented.");
    }
}