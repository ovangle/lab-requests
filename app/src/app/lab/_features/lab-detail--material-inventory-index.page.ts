import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { LabContext } from "../lab-context";
import { MaterialInventoryService } from "src/app/material/material-inventory";
import { map, shareReplay, switchMap } from "rxjs";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { MatListModule } from "@angular/material/list";
import { MeasurementUnitPipe } from "src/app/common/measurement/common-measurement-unit.pipe";
import { CommonQuantityComponent } from "src/app/common/measurement/common-quantity.component";

@Component({
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,

        MatListModule,

        CommonQuantityComponent
    ],
    template: `
    @if (materialInventories$ | async; as materialInventories) {
        <mat-list>
            @for (inventory of materialInventories; track inventory.id) {
                <mat-list-item>
                    <a [routerLink]="['/material', inventory.materialId, 'inventory', inventory.id]">
                        {{inventory.materialName}}
                    </a>
                    <span class="estimated-quantity">
                        Estimated stock: <common-quantity [quantity]="[inventory.estimatedQuantity, inventory.unitOfMeasurement]" />
                    </span>
                </mat-list-item>
            }
        </mat-list>
    }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabDetail__MaterialInventoryIndex {
    readonly _labContext = inject(LabContext);
    readonly _materialInventoryService = inject(MaterialInventoryService);

    readonly lab$ = this._labContext.committed$;
    readonly materialInventoryPage$ = this.lab$.pipe(
        switchMap(lab => this._materialInventoryService.queryPage({lab})),
        shareReplay(1)
    );

    readonly materialInventories$ = this.materialInventoryPage$.pipe(
        map(page => page.items)
    );
}