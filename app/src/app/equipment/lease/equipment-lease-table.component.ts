import { map } from "rxjs";
import { CommonModule } from "@angular/common";

import { ChangeDetectionStrategy, Component, inject, input } from "@angular/core";
import { MatTableModule } from "@angular/material/table";
import { ModelIndexPage } from "src/app/common/model/model";
import { LabAllocationConsumerContext } from "src/app/lab/common/allocatable/allocation-consumer-context";

import { EquipmentLease } from "./equipment-lease";
import { EquipmentInfoComponent } from "../equipment-info.component";


@Component({
    selector: 'equipment-lease-table',
    standalone: true,
    imports: [
        CommonModule,

        MatTableModule,

        EquipmentInfoComponent
    ],
    template: `
    @if (allocationConsumer$ | async; as consumer) {
        <mat-table [dataSource]="equipmentLeases$">
            <ng-container matColumnDef="equipment">
                <mat-header-cell *matHeaderCellDef>Equipment</mat-header-cell>
                <mat-cell *matCellDef="let lease">
                    <equipment-info [equipment]="lease.equipment" hideTags />
                </mat-cell>
            </ng-container>

            <ng-container matColumnDef="numInstalled">
                <mat-header-cell *matHeaderCellDef>No. required</mat-header-cell>
                <mat-cell *matCellDef="let lease">
                    {{lease.numRequired}}
                </mat-cell>
            </ng-container>

            <mat-header-row *matHeaderRowDef="displayedColumns()" />
            <mat-row *matRowDef="let lease; columns: displayedColumns()" />
        </mat-table>
    }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EquipmentLeaseTable {
    readonly _allocationConsumerContext = inject(LabAllocationConsumerContext);
    readonly allocationConsumer$ = this._allocationConsumerContext.committed$;

    readonly equipmentLeasePage$ = this.allocationConsumer$.pipe(
        map(consumer => consumer.getAllocationPage('equipment_lease') as ModelIndexPage<EquipmentLease>)
    );

    readonly equipmentLeases$ = this.equipmentLeasePage$.pipe(
        map(page => page.items)
    );

    displayedColumns = input<string[]>(['equipment', 'numRequired']);

}