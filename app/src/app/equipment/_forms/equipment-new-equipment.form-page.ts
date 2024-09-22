import { Component, inject, input } from "@angular/core";
import { Equipment, EquipmentService } from "../equipment";
import { EquipmentInstallation, EquipmentInstallationService } from "../installation/equipment-installation";
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { Lab, LabService } from "src/app/lab/lab";
import { ActivatedRoute, Router } from "@angular/router";
import { Q } from "@angular/cdk/keycodes";
import { combineLatest, filter, firstValueFrom, map, merge, NEVER, Observable, of, shareReplay, switchMap } from "rxjs";
import { ResearchPurchaseOrderFormComponent, researchPurchaseOrderFormGroupFactory } from "src/app/research/budget/research-purchase-order-form.component";
import { NewEquipmentFormComponent, NewEquipmentFormGroup } from "../installation/provisions/equipment-new-equipment-form.component";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { LabSearchComponent } from "src/app/lab/lab-search.component";
import { LabInfoComponent } from "src/app/lab/lab-info.component";
import { NewEquipmentRequest } from "../provision/equipment-provision";


@Component({
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,

        LabInfoComponent,
        LabSearchComponent,
        NewEquipmentFormComponent
    ],
    template: `
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

    `

})
export class EquipmentNewEquipmentFormPage {
    route = inject(ActivatedRoute);
    router = inject(Router);
    labService = inject(LabService);
    equipmentService = inject(EquipmentService);
    equipmentInstallationService = inject(EquipmentInstallationService);

    fb = inject(FormBuilder);
    _createPurchaseInfoForm = researchPurchaseOrderFormGroupFactory();

    readonly labSearchControl = new FormControl<Lab | null>(null);

    form = this.fb.group({
        lab: this.fb.control<Lab | null>(null, {
            validators: [Validators.required]
        }),
        numRequired: this.fb.control<number>(1, {
            nonNullable: true,
            validators: [Validators.min(1)]
        }),
        purchaseInfo: this._createPurchaseInfoForm()
    });

    equipmentInstallation$ = this.route.paramMap.pipe(
        map(params => params.get('equipment_installation')),
        switchMap(installationId => {
            if (installationId) {
                return this.equipmentInstallationService.fetch(installationId);
            } else {
                return of(null);
            }
        }),
        shareReplay(1)
    );

    equipment$: Observable<Equipment> = combineLatest([
        this.equipmentInstallation$.pipe(map(installation => installation?.equipmentId)),
        this.route.paramMap.pipe(map(params => params.get('equipment')))
    ]).pipe(
        switchMap(([idFromInstall, idFromRoute]) => {
            const equipmentId = idFromInstall || idFromRoute;
            if (equipmentId == null) {
                throw new Error(`Expected either 'equipment_installation' or 'equipment' in query params`)
            }
            return this.equipmentService.fetch(equipmentId);
        }),
        shareReplay(1)
    );

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
        const equipment = await firstValueFrom(this.equipment$);
        const lab = await firstValueFrom(this.lab$);

        const request: NewEquipmentRequest = {
            type: 'new_equipment',
            equipment,
            lab,
            numRequired: value.numRequired!,
            note: value.note!
        }

        const provision = await this.equipmentInstallationService.newEquipment(
            request
        );
    }

    _onCancel() {
        this.closeFormPane();
    }

    closeFormPane() {
        this.router.navigate(['/', { outlets: { form: null } }]);
    }

}