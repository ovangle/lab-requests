import { P, Q } from "@angular/cdk/keycodes";
import { CommonModule } from "@angular/common";
import { HttpParams } from "@angular/common/http";
import { Component, Inject, Input, inject } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatListModule } from "@angular/material/list";
import { Observable, combineLatest, distinctUntilChanged, firstValueFrom, map, of, shareReplay, startWith, switchMap } from "rxjs";
import { ModelSearchComponent, ModelSearchControl } from "src/app/common/model/search/search-control";
import { ModelSearchInputComponent } from "src/app/common/model/search/search-input-field.component";
import { Equipment } from "../equipment";
import { EquipmentContext } from "../equipment-context";
import { EquipmentInstallation, EquipmentInstallationService } from "./equipment-installation";
import { Lab, LabService } from "src/app/lab/lab";
import { LabSearchComponent } from "src/app/lab/lab-search.component";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";
import { MatCardModule } from "@angular/material/card";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { MatButtonModule } from "@angular/material/button";
import { LabEquipmentProvision } from "../provision/equipment-provision";


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

        ModelSearchInputComponent
    ],
    template: `
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
                        <button mat-icon-button routerLink="./provisions/{{provision.id}}">
                            <mat-icon>view</mat-icon>
                        </button>
                    )


                } @else {
                }
            </span>
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
    }
    .list-item > .lab-name {
        flex-basis: 50%;
    }

    .item-count {
        margin: 0 1em;
    }

    `
})
export class EquipmentInstallationListComponent {
    _equipmentContext = inject(EquipmentContext);
    _equipments = inject(EquipmentInstallationService);
    _labService = inject(LabService);

    readonly equipment$ = this._equipmentContext.committed$;

    _hideFilters = true;

    _onFilterVisibilityToggleClick() {
        this._hideFilters = !this._hideFilters;
    }

    readonly labSearch = new ModelSearchControl<Lab>(
        (search) => this._labService.query({ search }),
        lab => lab.name
    );

    readonly filterLab$ = this.labSearch.value$.pipe(
        map(value => value instanceof Lab ? value : null),
        startWith(null),
        distinctUntilChanged(),
        shareReplay(1)
    );

    readonly equipmentInstalls$: Observable<EquipmentInstallation[]> = combineLatest([
        this.equipment$,
        this.filterLab$
    ]).pipe(
        map(([ equipment, lab ]) => {
            return equipment.installations.filter(
                installation => lab == null ? true : installation.labId == lab.id
            );
        }),
        shareReplay(1)
    );

    readonly itemTemplates$ = this.equipmentInstalls$.pipe(
        switchMap(async (installs) => {
            const equipment = await firstValueFrom(this.equipment$);

            const templates = [];
            for (const install of installs) {
                const lab = await install.resolveLab(this._labService);
                const provision = equipment.activeProvision(lab);
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