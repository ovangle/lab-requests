import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { EquipmentTrainingDescriptionsInfoComponent } from "../training/training-descriptions-info.component";
import { EquipmentTagChipsComponent } from "../tag/equipment-tag-chips.component";
import { EquipmentDetailStateService, EquipmentDetailSubpage, setDetailPageSubroute } from "./equipment-detail.state";
import { map, switchMap, tap } from "rxjs";
import { EquipmentService } from "../equipment";
import { EquipmentContext } from "../equipment-context";
import { EquipmentTrainingDescriptionListComponent } from "../training/training-description-list.component";
import { EquipmentInstallationTableComponent } from "../installation/equipment-installation-table.component";

function equipmentFromRouteParams() {
    const route = inject(ActivatedRoute);
    const equipmentService = inject(EquipmentService);

    return route.paramMap.pipe(
        map(params => params.get('equipment_id')),
        switchMap(equipmentId => {
            if (equipmentId == null) {
                throw new Error(`No equipment_id in route params`)
            }
            return equipmentService.fetch(equipmentId);
        })
    );
}

@Component({
    selector: 'equipment-detail-page',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        EquipmentTrainingDescriptionListComponent,
        EquipmentTrainingDescriptionsInfoComponent,
        EquipmentTagChipsComponent,
        EquipmentInstallationTableComponent
    ],
    host: {
        '[class.scaffold-content-full-width]': 'true'
    },
    template: `
    @if (equipment$ | async; as equipment) {
        <div class="equipment-page-title">
            <h1>
                {{equipment.name}}
            </h1>
        </div>

        <div class="general-info">
            <equipment-tag-chips [tags]="equipment.tags" />
            <div class="description">
                {{equipment.description}}
            </div>
        </div>
        <equipment-training-description-list [trainingDescriptions]="equipment.trainingDescriptions" />

        <div class="installations">
            <div class="installations-header">
            <h4>Installations</h4>
            <a mat-icon-button [routerLink]="[{outlets: {form: addEquipmentFormLink$ | async}}]">
                <mat-icon>add</mat-icon>
            </a>
            </div>
            @if (equipment.installations.totalItemCount === 0) {
                <p>Equipment has no installations</p>
            } @else {
                <equipment-installation-table [installations]="equipment.installations.items" />
            }
        </div>

    }
    `,
    styles: `
    .equipment-page-header, .installations-header {
        display: flex;
        justify-content: space-between;
    }
    .edit-button {
        float: right;
    }
    `,
    providers: [
        EquipmentContext
    ]
})
export class EquipmentDetailPage {
    readonly context = inject(EquipmentContext);
    readonly equipment$ = equipmentFromRouteParams().pipe(
        tap(equipment => this.context.nextCommitted(equipment))
    );

    readonly addEquipmentFormLink$ = this.equipment$.pipe(
        map((equipment) => [
            'equipment-forms',
            'equipment-installation',
            { equipment: equipment.id }
        ])
    );

}