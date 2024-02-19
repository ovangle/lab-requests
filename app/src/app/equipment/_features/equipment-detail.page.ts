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
      <div class="equipment-page-header">
        <h1>
            {{equipment.name}}
        </h1>
        @if (showDetail) {
            <a mat-raised-button routerLink="./update" color="primary">
                <mat-icon>edit</mat-icon>Edit
            </a>
        }
      </div>

      <p><em>{{ equipment.description }}</em></p>

      <router-outlet (activate)="_onRouterOutletActivate()" (deactivate)="_onRouterOutletDeactivate()"/>

      @if (showDetail) {

        <equipment-installation-list>
            <h3 class="list-title">Installations</h3>
        </equipment-installation-list>

        <lab-equipment-training-descriptions-info
            [trainingDescriptions]="equipment.trainingDescriptions"
        />
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
    `

})
export class EquipmentDetailPage {
    readonly context = inject(EquipmentContext);
    readonly equipment$ = this.context.committed$;

    showDetail: boolean = true;

    _onCreateProvisionButtonClick() {
    }

    _onRouterOutletActivate() {
        window.setTimeout(() => this.showDetail = false);
    }
    _onRouterOutletDeactivate() {
        this.showDetail = true;
    }
}