import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { EquipmentSchema, EquipmentSchemaForm, EquipmentSchemaService } from "./equipment-schema";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatCardModule } from "@angular/material/card";
import { MatRadioModule } from "@angular/material/radio";
import { ProvisionFormComponent } from "../../common/provision/provision-form.component";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";


@Component({
    selector: 'lab-req-equipment-schema-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatCardModule,

        MatFormFieldModule,
        MatIconModule,
        MatCheckboxModule,
        MatInputModule,
        MatRadioModule,

    ],
    template: `
    <mat-card>
        <mat-card-title>
            <h4>Provision new equipment</h4>
        </mat-card-title>

        <mat-card-content>
            <form [formGroup]="form">
                <mat-form-field>
                    <mat-label>Name</mat-label>
                    <input matInput id="equipment-name" formControlName="name" />
                </mat-form-field>

                <mat-checkbox formControlName="requiresTraining">
                    This equipment requires induction before use.
                </mat-checkbox>

                <mat-form-field *ngIf="form.value.requiresTraining">
                    <mat-label>Training description</mat-label>

                    <textarea matInput formControlName="trainingDescription"
                            placeholder="Describe the training required"
                            [attr.required]="true">
                    </textarea>
                </mat-form-field>
            </form>

        </mat-card-content>
        <mat-card-footer>
            <button mat-button (click)="saveSchema()"
                    [disabled]="!form.valid">
                <mat-icon>save</mat-icon>&nbsp;Save
            </button>
            <button mat-button (click)="cancelSchema()">
                <mat-icon>cancel</mat-icon>&nbsp;Cancel
            </button>
        </mat-card-footer>
    </mat-card>
    `
})
export class EquipmentSchemaFormComponent {
    readonly schemaService = inject(EquipmentSchemaService);

    @Input()
    form: EquipmentSchemaForm;

    @Output()
    save = new EventEmitter<EquipmentSchema>();

    @Output()
    cancel = new EventEmitter<void>();

    saveSchema() {
        const schemaName: string = this.form.value.name!;
        const schema = new EquipmentSchema({...this.form.value, name: schemaName});
        this.save.next(schema);
    }
    cancelSchema() {
        this.cancel.next();
     }
}