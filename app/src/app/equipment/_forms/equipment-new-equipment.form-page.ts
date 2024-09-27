import { Component, DestroyRef, inject, input } from "@angular/core";
import { Equipment, EquipmentService } from "../equipment";
import { EquipmentInstallation, EquipmentInstallationService } from "../installation/equipment-installation";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Lab, LabService } from "src/app/lab/lab";
import { ActivatedRoute, Router } from "@angular/router";
import { Q } from "@angular/cdk/keycodes";
import { AsyncSubject, combineLatest, filter, firstValueFrom, map, merge, NEVER, Observable, of, shareReplay, switchMap } from "rxjs";
import { ResearchPurchaseOrderFormComponent, researchPurchaseOrderFormGroupFactory } from "src/app/research/budget/research-purchase-order-form.component";
import { NewEquipmentFormComponent, NewEquipmentFormGroup, newEquipmentFormGroupFactory } from "../installation/provisions/equipment-new-equipment-form.component";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { LabSearchComponent } from "src/app/lab/lab-search.component";
import { LabInfoComponent } from "src/app/lab/lab-info.component";
import { NewEquipmentProvision, NewEquipmentRequest } from "../provision/equipment-provision";
import { AbstractModelForm } from "src/app/common/model/forms/abstract-model-form.component";
import { EquipmentInstallationContext, provideEquipmentInstallationContext } from "../installation/equipment-installation-context";
import { EquipmentContext, provideEquipmentContextFromRoute } from "../equipment-context";
import { EquipmentProvisionInfo__NewEquipmentProvision } from "../provision/equipment-provision-info.component";
import { MatButtonModule } from "@angular/material/button";
import { ScaffoldFormPaneControl } from "src/app/scaffold/form-pane/form-pane-control";


@Component({
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatFormFieldModule,

        LabInfoComponent,
        LabSearchComponent,
        NewEquipmentFormComponent,

        EquipmentProvisionInfo__NewEquipmentProvision
    ],
    template: `

    @if (_createdProvision) {
        <h4>Created provision</h4>
        <equipment-provision-info--new-equipment-provision [provision]="_createdProvision" />

        <button mat-button (click)="closeFormPane()">OK</button>
    } @else {

        @if (equipment$ | async; as equipment) {
            <div class="purchase-new-equipment">
                <h4>Purchase new equipment</h4>

                <p>Creates a provision for purchasing new equipment</p>

                @let install = equipmentInstallation$ | async;

                @if (install == null) {
                <mat-form-field>
                    <mat-label>Lab</mat-label>
                    <lab-search required
                                [formControl]="labSearchControl"
                                [discipline]="equipment.disciplines" />
                </mat-form-field>
                } @else {
                    <lab-info [lab]="install.labId" />
                }

                @if (lab$ | async; as lab) {
                    <equipment-new-equipment-form [equipment]="equipment"
                                                [lab]="lab"
                                                (submit)="_onSubmit($event)"
                                                (cancel)="_onCancel()" />
                }
            </div>
        }
    }
    `,
    providers: [
        provideEquipmentContextFromRoute({ isOptionalParam: true }),
        provideEquipmentInstallationContext({ isOptionalParam: true }),
    ]

})
export class EquipmentNewEquipmentFormPage extends AbstractModelForm<NewEquipmentFormGroup> {

    labService = inject(LabService);
    readonly equipmentContext = inject(EquipmentContext);
    readonly equipmentInstallationContext = inject(EquipmentInstallationContext);

    formPane = inject(ScaffoldFormPaneControl);
    fb = inject(FormBuilder);

    readonly labSearchControl = new FormControl<Lab | null>(null);
    override _createStandaloneForm = newEquipmentFormGroupFactory();

    equipmentInstallation$ = this.equipmentInstallationContext.mCommitted$;

    _createdProvision: NewEquipmentProvision | null = null;

    constructor() {
        super();
        const syncEquipment = this.equipmentInstallation$.pipe(
            map(installation => installation?.equipmentId),
            filter((equipmentId): equipmentId is string => equipmentId != null)
        ).subscribe(equipmentId => {
            this.equipmentContext.nextCommitted(equipmentId);
        })

        inject(DestroyRef).onDestroy(() => {
            syncEquipment.unsubscribe();
        })
    }

    equipment$ = this.equipmentContext.committed$;

    lab$: Observable<Lab> = merge(
        this.labSearchControl.valueChanges.pipe(
            filter((l): l is Lab => l != null)
        ),
        this.equipmentInstallation$.pipe(
            switchMap(equipmentInstallation => equipmentInstallation ? this.labService.fetch(equipmentInstallation.labId) : NEVER)
        )
    ).pipe(
        filter((l): l is Lab => l != null)
    );

    async _onSubmit(value: NewEquipmentFormGroup['value']) {
        const lab = await firstValueFrom(this.lab$);

        const request: NewEquipmentRequest = {
            lab,
            numRequired: value.numRequired!,
            note: value.note!
        }

        const provision = await this.equipmentInstallationContext.newEquipment(request);
    }

    _onCancel() {
        this.closeFormPane();
    }

    closeFormPane() {
        this.formPane.close()
    }

}