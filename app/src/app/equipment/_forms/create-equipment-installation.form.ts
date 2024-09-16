import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { EquipmentService } from "../equipment";
import { map, switchMap } from "rxjs";
import { CommonModule } from "@angular/common";
import { EquipmentInstallationFormComponent, equipmentInstallationFormGroupFactory } from "../installation/equipment-installation-form.component";
import { ReactiveFormsModule } from "@angular/forms";


@Component({
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        EquipmentInstallationFormComponent
    ],
    template: `
    <h3>Add equipment installation</h3>
    @if (equipment$ | async; as equipment) {
        <equipment-installation-form [equipment]="equipment" />
    }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateEquipmentInstallationFormPage {
    readonly route = inject(ActivatedRoute);
    readonly equipmentService = inject(EquipmentService);

    readonly equipment$ = this.route.paramMap.pipe(
        map(queryParams => queryParams.get('equipment')),
        switchMap(equipmentId => {
            if (equipmentId == null) {
                throw new Error(`Expected an 'equipment' in route params`);
            }
            return this.equipmentService.fetch(equipmentId)
        })
    );


}