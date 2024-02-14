import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Observable, shareReplay, switchMap } from "rxjs";
import { Equipment, injectEquipmentService } from "../equipment";
import { EquipmentContext } from "../equipment-context";
import { LabEquipmentPageHeaderComponent } from "src/app/lab/equipment/equipment-page-header.component";
import { EquipmentInstallationListComponent } from "../installation/installation-list.component";
import { EquipmentTrainingDescriptionsInfoComponent } from "src/app/lab/equipment/training/training-descriptions-info.component";
import { MatButtonModule } from "@angular/material/button";


export function equipmentFromActivatedRoute(): Observable<Equipment> {
    let activatedRoute = inject(ActivatedRoute);
    const equipments = injectEquipmentService();

    function isEquipmentIndexRoute(route: ActivatedRoute) {
        return route.routeConfig?.path?.includes('equipment');
    }

    while (activatedRoute.parent && !isEquipmentIndexRoute(activatedRoute.parent)) {
        activatedRoute = activatedRoute.parent;
    }
    if (!activatedRoute) {
        throw new Error('No equipment index route in path');
    }

    return activatedRoute.paramMap.pipe(
        switchMap(params => {
            const equipmentId = params.get('equipment_id');
            if (!equipmentId) {
                throw new Error('No :equipment_id in activated route');
            }
            return equipments.fetch(equipmentId)
        }),
        shareReplay(1)
    );
}

@Component({
    selector: '',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        EquipmentInstallationListComponent,
        EquipmentTrainingDescriptionsInfoComponent
    ],
    template: `
    @if (equipment$ | async; as equipment) {
      <h1>
        {{equipment.name}}
        
        <div class="edit-button">
            <button mat-raised-button routerLink="./edit">
                Edit
            </button>
        </div>
     </h1>
    
      <h3>Description</h3>
      <p>{{ equipment.description }}</p>

      <h3>Installations</h3>  
      <equipment-installation-list [equipment]="equipment" /> 

      <lab-equipment-training-descriptions-info
        [trainingDescriptions]="equipment.trainingDescriptions"
      >
      </lab-equipment-training-descriptions-info>
    }
    `,
    styles: `
    .edit-button {
        float: right;
    }
    `,
    providers: [
        EquipmentContext
    ]
})
export class EquipmentDetailPage {
    readonly equipment$ = equipmentFromActivatedRoute();
    readonly _context = inject(EquipmentContext);

    ngOnInit() {
        this._context.sendCommitted(this.equipment$);
    }
}