import { Component, Injectable, Input, ViewChild, inject } from "@angular/core";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Equipment, EquipmentForm } from "./equipment";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { RESOURCE_TYPE, ResourceFormComponent } from "../common/resource-form.component";
import { EquipmentSchemaSearchComponent } from "./schema/equipment-schema-search.component";
import { EquipmentSchema, EquipmentSchemaService } from "./schema/equipment-schema";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { ProvisionForm } from "../common/provision/provision-form.component";
import { BehaviorSubject, NEVER, Observable, filter, map, switchMap } from "rxjs";
import { Campus, campusName } from "../../experimental-plan/campus/campus";


@Component({
    selector: 'lab-req-equipment-resource-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatCardModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,

        ResourceFormComponent,
        EquipmentSchemaSearchComponent,

        ProvisionForm,
    ],
    template: `
    <lab-req-resource-form #resourceForm>
        <form *ngIf="resourceForm.form" [formGroup]="resourceForm.form">
            <lab-req-equipment-schema-search formControlName="schema">
            </lab-req-equipment-schema-search>

            <ng-container *ngIf="schema$ | async as schema">
                <mat-form-field>
                    <mat-label>Units required</mat-label>
                    <input matInput type="number" formControlName="numRequested" />
                </mat-form-field>

                <mat-form-field>
                    <mat-label>Setup instructions</mat-label>
                    <textarea matInput formControlName="setupInstructions"
                              placeholder="Instructions to prepare the equipment for this experiment">
                    </textarea>
                </mat-form-field>

                <ng-container *ngIf="isProvisioningRequired$ | async">
                    <lab-req-provision-form
                        [atCampus]="atCampus"
                        [numAvailableUnits]="numAvailableUnits$ | async"
                        resourceType="equipment"
                        provisioningUnit="per unit"
                        [form]="resourceForm.form">
                    </lab-req-provision-form>
                </ng-container>

                <ng-container *ngIf="schema.requiresTraining">
                    <mat-card>
                        <mat-card-content>
                            <div class="warning-info">
                                <mat-icon>warning</mat-icon>
                                <div>
                                    <p>The equipment requires training before use</p>

                                    <p><i>{{schema.trainingDescription}}</i></p>
                                </div>
                            </div>
                            <mat-checkbox formControlName="hasRequiredTraining">
                                I have previously taken the required training
                            </mat-checkbox>
                        </mat-card-content>
                    </mat-card>
                </ng-container>

                <mat-checkbox formControlName="requestsInstruction">
                    I require additional instruction in order to use this device
                </mat-checkbox>
            </ng-container>
        </form>
    </lab-req-resource-form>
    `,
    styles: [`
        .warning-info {
            display: flex;
            align-items: center;
        }
    `],
    providers: [
        { provide: RESOURCE_TYPE, useValue: 'equipment' }
    ]
})
export class EquipmentResourceFormComponent {
    readonly schemaService = inject(EquipmentSchemaService);

    @Input()
    atCampus: Campus;

    get atCampusName() {
        return campusName(this.atCampus)
    }

    @ViewChild(ResourceFormComponent, {static: true})
    readonly resourceForm: ResourceFormComponent<Equipment, EquipmentForm>;

    readonly _formSubject = new BehaviorSubject<EquipmentForm | null>(null);

    readonly schema$: Observable<EquipmentSchema | null> = this._formSubject.pipe(
        filter((f): f is EquipmentForm => f != null),
        switchMap(form => form.valueChanges),
        map(value => value.schema || null)
    );

    readonly numAvailableUnits$: Observable<number> = this.schema$.pipe(
        filter((s): s is EquipmentSchema => s != null),
        switchMap(schema => this.schemaService.availableUnitsAtCampus(schema, this.atCampus))
    );

    readonly isProvisioningRequired$: Observable<boolean> = this._formSubject.pipe(
        filter((f): f is EquipmentForm => f != null),
        switchMap(form => form.valueChanges),
        map(value => {
            const schema = value.schema;
            if (typeof value.numRequested === 'number') {
                return value.numRequested > 1;
            }
            return !schema || !schema.isProvisioned;
        })
    )

    ngAfterViewInit() {
        this._formSubject.next(this.resourceForm.form);
    }

    ngOnDestroy() {
        this._formSubject.complete();
    }


}

