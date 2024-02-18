import { CommonModule } from "@angular/common";
import { Component, ViewChild, inject } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Observable, shareReplay, switchMap } from "rxjs";
import { Equipment, EquipmentService } from "../equipment";
import { EquipmentContext } from "../equipment-context";
import { EquipmentInstallationListComponent } from "../installation/installation-list.component";
import { EquipmentTrainingDescriptionsInfoComponent } from "src/app/lab/equipment/training/training-descriptions-info.component";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";


export function equipmentFromActivatedRoute(): Observable<Equipment> {
    let activatedRoute = inject(ActivatedRoute);
    const equipments = inject(EquipmentService);

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
    selector: 'equipment-detail-page',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        EquipmentInstallationListComponent,
        EquipmentTrainingDescriptionsInfoComponent
    ],
    template: `
    @if (equipment$ | async; as equipment) {
      <h1>
        {{equipment.name}}
        <a mat-icon-button routerLink="./update">
            <mat-icon>pencil</mat-icon>Edit
        </a>
      </h1>

      <router-outlet />

      @if (showDetail) {
        <h3>Description</h3>
        <p>{{ equipment.description }}</p>

        <div class="installations">
            <h3>
                Installations
                <button mat-button (click)="_onCreateProvisionButtonClick()">
                    <mat-icon>plus</mat-icon>create
                </button> 
            </h3>  
            <equipment-installation-list /> 
        </div>

        <lab-equipment-training-descriptions-info
            [trainingDescriptions]="equipment.trainingDescriptions"
        >
        </lab-equipment-training-descriptions-info>
        }
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

    readonly activatedRoute = inject(ActivatedRoute);

    showDetail: boolean = false;

    ngOnInit() {
        debugger;
        this._context.sendCommitted(this.equipment$);
    }

    _onCreateProvisionButtonClick() {
    }
}