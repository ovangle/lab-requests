import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";

export function equipmentTrainingControl() {
    return new FormControl('', {nonNullable: true});
}

@Component({
    selector: 'lab-equipment-training-list-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatListModule
    ],
    template: `
    <mat-list>
        <mat-list-item *ngFor="let control of form.controls">
            {{control.value}}
            <button mat-icon-button (click)="remove(control.value)">
                <mat-icon>cancel</mat-icon>
            </button>
        </mat-list-item>

        <mat-list-item>
            <ng-container *ngIf="!isAddingItem; else newItemDescriptionInput">
                <button mat-flat-button (click)="add()">
                    + Add ...
                </button>
            </ng-container>

            <ng-template #newItemDescriptionInput>
                <mat-form-field>
                    <input matInput 
                          placeholder="Description"
                          [formControl]="addControl!" 
                          (blur)="_addOnBlur($event)" />
                </mat-form-field>
            </ng-template>
        </mat-list-item>
    </mat-list>
    `
})
export class EquipmentTrainingListFormComponent {
    @Input({required: true})
    committed: string[];

    @Input({required: true})
    form: FormArray<FormControl<string>>;

    @Output()
    requestCommit = new EventEmitter<string[]>();

    add() {
        this.form.controls.push(equipmentTrainingControl())
    }

    _addOnBlur(event: FocusEvent) {
        this.requestCommit.emit(this.form.controls.map(c => c.value))
    }

    get isAddingItem() {
        return this.form.controls.length > this.committed.length;
    }
    get addControl(): FormControl | undefined {
        return this.form.controls[this.committed.length];
    }

    remove(value: string) {
        const index = this.form.controls.findIndex(c => c.value === value);
        if (index >= 0) {
            this.form.removeAt(index);
        }
    }
}