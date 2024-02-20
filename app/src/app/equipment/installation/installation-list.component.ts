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
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";
import { MatCardModule } from "@angular/material/card";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { MatButtonModule } from "@angular/material/button";


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
            <div class="title">
                <ng-content select=".list-title" />
            </div>
            
            <div class="actions">
                <a mat-raised-button color="primary" [routerLink]="['./', 'create-provision']">
                    <mat-icon>add</mat-icon>Add
                </a>
            </div>    
        </mat-card-header>

        <mat-card-content>
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
            } @else {
                <div><em>This equipment has no current installations</em></div>
            }
        </mat-card-content>

    </mat-card>

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
    ],
    styles: `
    .mat-card-header {
        display: flex;
        justify-content: space-between;
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
    `
})
export class EquipmentInstallationListComponent {
    _equipmentContext = inject(EquipmentContext);
    _equipments = inject(EquipmentInstallationService);
    _labs = inject(LabService);

    readonly equipment$ = this._equipmentContext.committed$;

    _hideFilters = true;

    _onFilterVisibilityToggleClick() {
        this._hideFilters = !this._hideFilters;
    }

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