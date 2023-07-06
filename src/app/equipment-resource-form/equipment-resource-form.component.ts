import { Component, Input } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";

export class EquipmentResource {
    name: string;
    description: string;
    estimatedCost: number;
    isUniversitySupplied: boolean;
}

export type EquipmentResourceFormGroup = FormGroup<{
    [K in keyof EquipmentResource]: FormControl<EquipmentResource[K]>
}>

export function createEquipmentResourceFormGroup(): EquipmentResourceFormGroup {
    return new FormGroup({
        name: new FormControl<string>('', {nonNullable: true}),
        description: new FormControl<string>('', {nonNullable: true}),
        estimatedCost: new FormControl<number>(0, {nonNullable: true}),
        isUniversitySupplied: new FormControl<boolean>(true, {nonNullable: true})
    });
}

@Component({
    selector: 'lab-equipment-form',
    standalone: true,
    imports: [
        MatFormFieldModule,
        MatSelectModule
    ],
    template: `
    <div>
        <mat-form-field>
            <label for="equipment-{{index}}-name">Name</label>
            <input matNativeControl type="text"
                    id="equipment-{{index}}-name"
                    formControlName="name" />
        </mat-form-field>

        <mat-form-field>
            <label for="equipment-{{index}}-description">Description</label>
            <input matNativeControl type="text" multiline
                   id="equipment-{{index}}-description"
                   formControlName="description"
            />
        </mat-form-field>

        <mat-form-field>
            <label for="equipment-{{index}}-is-university-supplied">
                Supplied by university
            </label>

            <mat-select id="equipment-{{index}}-is-university-supplied"
                        formControlName="isUniversitySupplied">
                <mat-option [value]="true">Yes</mat-option>
                <mat-option [value]="false">No</mat-option>
            </mat-select>
        </mat-form-field>

        <mat-form-field>
            <label for="equipment-{{index}}-estimated-cost">
                Estimated cost
            </label>

            <input matNativeControl type="number"
                   id="equipment-{{index}}-estimated-cost"
                    formControlName="estimatedCost" />
        </mat-form-field>
    </div>
    `
})
export class LabEquipmentForm {
    /**
     * The equipment id.
     */
    @Input()
    index: number = 0;

    @Input()
    form: EquipmentResourceFormGroup;
}


@Component({
    selector: 'lab-request-equipment-resource-form',
    standalone: true,
    template: `
    <div>
        <div id="resource-description">
            e.g. Instruments, specialised glassware
        </div>

        <div id="extra-data">
        </div>
    </div>
    `
})
export class EquipmentResourceFormComponent {
    @Input()
    form: FormGroup;
}
