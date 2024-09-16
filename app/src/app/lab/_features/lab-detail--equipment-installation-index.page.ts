import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { LabContext } from "../lab-context";
import { EquipmentInstallationService } from "src/app/equipment/installation/equipment-installation";
import { map, shareReplay, switchMap } from "rxjs";
import { MatListModule } from "@angular/material/list";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";



@Component({
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatListModule
    ],
    template: `
    @if (equipmentInstallations$ | async; as equipmentInstallations) {
        <mat-list>
            @for (installation of equipmentInstallations; track installation.id) {
                <mat-list-item>
                    <a [routerLink]="['/equipment', installation.equipmentId, 'installations', installation.id]">
                        {{installation.equipmentName}}
                    </a>
                    <span class="num-installed">{{installation.numInstalled}}</span>
                </mat-list-item>
            }
        </mat-list>
    }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush

})
export class LabDetail__EquipmentInstallationIndex {
    readonly _labContext = inject(LabContext);
    readonly _equipmentInstallationService = inject(EquipmentInstallationService);

    readonly lab$ = this._labContext.committed$;

    readonly equipmentInstallationPage$ = this.lab$.pipe(
        switchMap(lab => this._equipmentInstallationService.queryPage({lab: lab.id})),
        shareReplay(1)
    );

    readonly equipmentInstallations$ = this.equipmentInstallationPage$.pipe(map(page => page.items));
}