import { Q } from "@angular/cdk/keycodes";
import { CommonModule } from "@angular/common";
import { HttpParams } from "@angular/common/http";
import { Component, Inject, Input, inject } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatListModule } from "@angular/material/list";
import { Observable, combineLatest, firstValueFrom, map, of, shareReplay } from "rxjs";
import { ModelSearchComponent, ModelSearchControl } from "src/app/common/model/search/search-control";
import { ModelSearchInputComponent } from "src/app/common/model/search/search-input-field.component";
import { Equipment } from "../equipment";
import { EquipmentContext } from "../equipment-context";
import { EquipmentInstallation, EquipmentInstallationService } from "./equipment-installation";
import { Lab, LabService } from "src/app/lab/lab";
import { LabSearchComponent } from "src/app/lab/lab-search.component";


@Component({
    selector: 'equipment-installation-list',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatListModule,
        ModelSearchInputComponent
    ],
    template: `
    <common-model-search-input-field [search]="labSearch">
        <mat-label>Lab</mat-label>
    </common-model-search-input-field>

    @if (equipmentInstalls$ | async; as installs) {
        <mat-list>
            @for(install of installs; track install.id) {
                <mat-list-item>
                    @if (installCounts(install) | async; as templateContext) {
                        <ng-container *ngTemplateOutlet="itemTemplate; context: templateContext" />
                    }
                </mat-list-item>
            }
        </mat-list>
    }

    <ng-template #itemTemplate let-lab let-numInstalled="numInstalled" let-numPending="numPending">
        <span class="lab-name">{{lab.name}}</span>
        <span class="num-installed">
            <span class="item-label"><em>installed</em></span>
            <span class="item-count">{{numInstalled}}</span>
        </span>
        <span class="num-pending">
            <span class="item-label"><em>pending</em></span>
            <span class="item-count">{{numPending}}</span>
        </span>
    </ng-template>
    `,
    providers: [
        EquipmentInstallationService
    ]
})
export class EquipmentInstallationListComponent {
    _equipmentContext = inject(EquipmentContext);
    _equipments = inject(EquipmentInstallationService);
    _labs = inject(LabService);

    readonly equipment$ = this._equipmentContext.committed$;

    readonly labSearch = new ModelSearchControl<Lab>(
        (search) => this._labs.query({ search }),
        lab => lab.name
    );

    readonly equipmentInstalls$: Observable<EquipmentInstallation[]> = combineLatest([
        this.equipment$,
        this.labSearch.modelOptions$
    ]).pipe(
        map(([equipment, labs]) => {
            return equipment.installations.filter(
                installation => labs.some((l) => l.id === installation.labId)
            );
        }),
        shareReplay(1)
    );

    async installCounts(install: EquipmentInstallation): Promise<{ $implicit: Lab, numInstalled: number, numPending: number }> {
        const lab = await install.resolveLab(this._labs);

        const labInstalls = (await firstValueFrom(this.equipmentInstalls$))
            .filter(install => install.labId === lab.id);

        const numInstalled = labInstalls.filter(install => install.isInstalled)
            .reduce((acc, installation) => acc + installation.numInstalled, 0)
        const numPending = labInstalls.filter(install => install.isPendingInstallation)
            .reduce((acc, installation) => acc + installation.numInstalled, 0);

        return { $implicit: lab, numInstalled, numPending };
    }
}