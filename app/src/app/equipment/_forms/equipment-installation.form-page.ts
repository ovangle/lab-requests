import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { EquipmentInstallationRequest, EquipmentInstallationService } from "../installation/equipment-installation";
import { ActivatedRoute, Router } from "@angular/router";
import { combineLatest, firstValueFrom, map, of, shareReplay, switchMap, tap } from "rxjs";
import { EquipmentService } from "../equipment";
import { EquipmentInstallationFormComponent, EquipmentInstallationFormGroup } from "../installation/equipment-installation-form.component";
import { CommonModule } from "@angular/common";
import { EquipmentInstallationInfoComponent } from "../installation/equipment-installation-info.component";
import { EquipmentContext, provideEquipmentContextFromRoute } from "../equipment-context";
import { ScaffoldFormPaneControl } from "src/app/scaffold/form-pane/form-pane-control";
import { EquipmentInstallationContext, provideEquipmentInstallationContext } from "../installation/equipment-installation-context";

@Component({
    standalone: true,
    imports: [
        CommonModule,
        EquipmentInstallationInfoComponent,
        EquipmentInstallationFormComponent
    ],
    template: `
    <div class="page-header">
        @if (equipmentInstallation$ | async; as installation) {
            <h4>Update <equipment-installation-info [installation]="installation" /></h4>

            <p><b>note:</b>
            <i>
                This form corrects an error in an existing installation.
                It does not create a provision to add new equipment.
            </i></p>
        } @else {
            <h4>Add existing installation</h4>
            <p>
                <b>note</b>This form declares an existing installation.
                It does not create a provision to add new equipment.
            </p>
        }
    </div>

    @if (equipment$ | async; as equipment) {
        <equipment-installation-form
            [installation]="equipmentInstallation$ | async"
            [equipment]="equipment"
            (submit)="_onSubmit($event)"
            (cancel)="_onCancel()" />
    }
    `,
    providers: [
        provideEquipmentContextFromRoute({ isOptionalParam: true }),
        provideEquipmentInstallationContext({ isOptionalParam: true })
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EquipmentInstallationFormPage {
    route = inject(ActivatedRoute);
    router = inject(Router);

    formPane = inject(ScaffoldFormPaneControl);

    equipmentService = inject(EquipmentService);
    equipmentContext = inject(EquipmentContext);
    equipmentInstallationContext = inject(EquipmentInstallationContext);
    equipmentInstallationService = inject(EquipmentInstallationService);

    readonly equipmentInstallation$ = this.equipmentInstallationContext.mCommitted$.pipe(
        tap(installation => {
            if (installation != null) {
                this.equipmentContext.nextCommitted(installation.equipmentId);
            }
        })
    );

    readonly isUpdate$ = this.equipmentInstallation$.pipe(
        map(installation => installation != null)
    );

    readonly equipment$ = this.equipmentContext.committed$

    async _onSubmit(value: EquipmentInstallationFormGroup['value']) {
        const equipment = await firstValueFrom(this.equipment$);
        let equipmentInstallation = await firstValueFrom(this.equipmentInstallation$);

        const req: EquipmentInstallationRequest = {
            equipment: equipment.id,
            lab: value.lab!.id,
            numInstalled: value.numInstalled!,
            modelName: value.modelName!,
        }

        if (equipmentInstallation != null) {
            equipmentInstallation = await firstValueFrom(this.equipmentInstallationService.update(equipmentInstallation, req));
        } else {
            equipmentInstallation = await firstValueFrom(this.equipmentInstallationService.create(req));
        }
        this.formPane.close();

    }

    _onCancel() {
        this.closeFormPane();
    }

    closeFormPane() {
        this.router.navigate([{ outlets: { form: null } }]);
    }

}