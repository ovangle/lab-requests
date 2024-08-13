import { Component } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { StorageType } from "./lab-storage-type";
import { StorageTypeSelectComponent } from './lab-storage-type-select.component'


@Component({
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,

        StorageTypeSelectComponent
    ],
    template: `
    <form [formGroup]="form" (submit)="onSubmit()">
        <mat-form-field>
            <mat-label>Storage type</mat-label>

            <lab-storage-type-select 
                required
                formControlName="storageType" />
            
        </mat-form-field>

        <div>
            selected: {{form.value.storageType}}
        </div>
    </form>
    `
})
export class LabStorageLikeSelectExample {
    readonly form = new FormGroup({
        storageType: new FormControl<StorageType>('general')
    })

    onSubmit() {
        console.log('storageType', this.form.value.storageType!);
    }

}