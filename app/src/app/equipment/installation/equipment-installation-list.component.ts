
import { Observable, combineLatest, distinctUntilChanged, map, shareReplay, startWith, switchMap } from "rxjs";
import { Component, inject, input } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatListModule } from "@angular/material/list";
import { ModelSearchControl } from "src/app/common/model/search/search-control";
import { ModelSearchInputComponent } from "src/app/common/model/search/search-input-field.component";
import { Lab, LabService } from "src/app/lab/lab";
import { LabInstallationListComponent } from "src/app/lab/common/installable/installation-list.component";

import { Equipment } from "../equipment";
import { EquipmentInstallation, EquipmentInstallationService } from "./equipment-installation";
import { EquipmentInstallationInfoComponent } from "./equipment-installation-info.component";


@Component({
    selector: 'equipment-installation-list',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,

        MatFormFieldModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatListModule,

        ModelSearchInputComponent,

        LabInstallationListComponent,
        EquipmentInstallationInfoComponent
    ],
    template: `
    <lab-installation-list
        [installable]="equipment()"
        [labQuery]="(labQuery$ | async) || {}">
        <ng-template #itemTemplate>
        </ng-template>
    </lab-installation-list>

    <mat-card>
        <mat-card-header>
            <mat-card-title>
                <ng-content select=".list-title" />
            </mat-card-title>
            <div class="actions">
                <a mat-button color="primary" [routerLink]="['./', 'create-provision']">
                    <mat-icon>add</mat-icon>add
                </a>
            </div>    
        </mat-card-header>

        <mat-card-content>
            <!--
            <div class="list-filter-header">
                <h4>Filters</h4>
                <div class="list-filter-controls">
                    <button mat-icon-button 
                            (click)="_onFilterVisibilityToggleClick()">
                        <mat-icon>{{_hideFilters ? 'visibility' : 'visibility_off'}}</mat-icon>
                    </button>
                </div>
            </div>
            <div class="list-filter" [class.list-filter-hidden]="_hideFilters">
                <common-model-search-input-field [search]="labSearch"
                                                clearOnFocus> 
                    <mat-label>Lab</mat-label>
                    <span matIconPrefix><mat-icon>search</mat-icon></span>
                </common-model-search-input-field>
            </div>
            -->

            @if (itemTemplates$ | async; as itemTemplates) {
                <mat-list>
                    @for (item of itemTemplates; track item.$implicit.id) {
                        <mat-list-item>
                            <ng-container *ngTemplateOutlet="itemTemplate; context: item" />
                        </mat-list-item>
                    }
                </mat-list>
            } @else {
                <div><em>This equipment has no current installations</em></div>
            }
        </mat-card-content>

    </mat-card>

    <ng-template #itemTemplate let-lab let-install="install" let-provision="provision">
        <div class="list-item">
            <span class="lab-name">{{lab.name}}</span>
            <span class="install-info">
                <em>installed</em>
                <span class="item-count">{{install.numInstalled}}</span>

                @if (provision) {
                    (
                        <em>pending</em> 
                        <span class="item-count">{{provision.quantityRequired}}</span>
                        
                    )
                } 
            </span>
            <button mat-icon-button routerLink="./installations/{{install.id}}">
                <mat-icon>pageview</mat-icon>
            </button>
        </div>
    </ng-template>
    `,
    providers: [
        EquipmentInstallationService
    ],
    styles: `
    .mat-mdc-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .list-filter-header {
        display: flex;
        justify-content: space-between;
    }

    .list-filter {
        overflow: hidden;
    }

    .list-filters-hidden {
        max-height: 0;
    }

    .list-item {
        display: flex;
        align-items: center;
    }
    .list-item > .lab-name {
        flex-basis: 50%;
    }
    .list-item > .install-info {
        flex-grow: 1;
    }

    .item-count {
        margin: 0 1em;
    }

    `
})
export class EquipmentInstallationListComponent {
    equipment = input.required<Equipment>();

    _hideFilters = true;

    _onFilterVisibilityToggleClick() {
        this._hideFilters = !this._hideFilters;
    }

    _labService = inject(LabService);
    readonly labSearch = new ModelSearchControl<Lab>(
        (search) => this._labService.query({ search }),
        lab => lab.name
    );
    readonly labQuery$ = this.labSearch.query$;

    readonly filterLab$ = this.labSearch.value$.pipe(
        map(value => value instanceof Lab ? value : null),
        startWith(null),
        distinctUntilChanged(),
        shareReplay(1)
    );

    readonly equipmentInstalls$: Observable<EquipmentInstallation[]> = combineLatest([
        toObservable(this.equipment),
        this.labSearch.modelOptions$
    ]).pipe(
        map(([ equipment, labs ]) => {
            return equipment.currentInstallations.filter(
                install => labs.some(l => isEqualModelRefs(l, install.lab))
            );
        }),
        shareReplay(1)
    );


    readonly itemTemplates$ = this.equipmentInstalls$.pipe(
        switchMap(async (installs) => {
            const templates = [];
            for (const install of installs) {
                const lab = await install.resolveLab(this._labService);
                const provision = install.currentProvisions[ 0 ];
                templates.push({
                    $implicit: lab,
                    install,
                    provision
                })
            }
            return templates;
        })
    )

    /*
    async installCounts(install: EquipmentInstallation): Promise<{ $implicit: Lab, numInstalled: number, numPending: number }> {
        const lab = await install.resolveLab(this._labService);
        const provision = await this.getProvisionInstall

        const labInstalls = (await firstValueFrom(this.equipmentInstalls$))
            .filter(install => install.labId === lab.id);

        const numInstalled = labInstalls.filter(install => install.isInstalled)
            .reduce((acc, installation) => acc + installation.numInstalled, 0)
        console.log('num installed', numInstalled);
        const numPending = labInstalls.filter(install => install.isPendingInstallation)
            .reduce((acc, installation) => acc + installation.numInstalled, 0);

        return { $implicit: lab, numInstalled, numPending };
    }
    */
}

function isEqualModelRefs(lab: Lab | null, lab1: string | Lab): unknown {
    throw new Error("Function not implemented.");
}
