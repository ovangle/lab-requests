import { CommonModule } from "@angular/common";
import { Component, ViewChild, inject } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Observable, shareReplay, switchMap } from "rxjs";
import { Equipment, EquipmentService } from "../equipment";
import { EquipmentContext } from "../equipment-context";
import { EquipmentInstallationListComponent } from "../installation/installation-list.component";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { EquipmentTrainingDescriptionsInfoComponent } from "../training/training-descriptions-info.component";
import { EquipmentTagChipsComponent } from "../tag/equipment-tag-chips.component";
import { EquipmentDetailStateService, setNoSubroute } from "./equipment-detail.state";

@Component({
    selector: 'equipment-detail-page',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        EquipmentInstallationListComponent,
        EquipmentTrainingDescriptionsInfoComponent,
        EquipmentTagChipsComponent
    ],
    host: {
        '[class.scaffold-content-full-width]': 'true'
    },
    template: `
    @if (equipment$ | async; as equipment) {
      <div class="equipment-page-header">
        <div class="equipment-page-title">
            <h1>
                {{equipment.name}}
            </h1>

            @if (showTagChips$ | async) {
                <equipment-tag-chips [equipment]="equipment" />
            }
        </div>

        @if (updateLinkVisible$ | async) {
            <a mat-raised-button 
               routerLink="./update" 
               color="primary"
               [disabled]="updateLinkDisabled$ | async">
                <mat-icon>edit</mat-icon>Edit
            </a>
        }
      </div>

      @if (showDescription$ | async) {
        <p><em>{{ equipment.description }}</em></p>
      }
      <router-outlet (deactivate)="_onRouterOutletDeactivate()" />

      @if (showDetail$ | async) {
        <lab-equipment-training-descriptions-info
            [trainingDescriptions]="equipment.trainingDescriptions"
        />

        <equipment-installation-list>
            <h3 class="list-title">Installations</h3>
        </equipment-installation-list>
      }
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
        EquipmentDetailStateService
    ]
})
export class EquipmentDetailPage {
    readonly context = inject(EquipmentContext);
    readonly equipment$ = this.context.committed$;

    readonly _equipmentDetailState = inject(EquipmentDetailStateService);
    readonly showTagChips$ = this._equipmentDetailState.select((s) => s.showTagChips);
    readonly updateLinkVisible$ = this._equipmentDetailState.select((s) => s.updateLinkVisible);
    readonly updateLinkDisabled$ = this._equipmentDetailState.select((s) => s.updateLinkDisabled);
    readonly showDescription$ = this._equipmentDetailState.select((s) => s.showDescription);
    readonly showDetail$ = this._equipmentDetailState.select((s) => s.showDetail);

    _onRouterOutletDeactivate() {
        this._equipmentDetailState.dispatch(setNoSubroute);
    }
}