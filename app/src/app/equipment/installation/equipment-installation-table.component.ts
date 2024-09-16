import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { MatListModule } from "@angular/material/list";
import { MatTableModule } from "@angular/material/table";
import { EquipmentInstallation } from "./equipment-installation";
import { LabInfoComponent } from "src/app/lab/lab-info.component";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { MatIconModule } from "@angular/material/icon";

@Component({
    selector: 'equipment-installation-table',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,

        MatIconModule,
        MatTableModule,

        LabInfoComponent
    ],
    template: `
    <mat-table [dataSource]="installations()">
        <ng-container matColumnDef="lab">
            <mat-header-cell *matHeaderCellDef>Lab</mat-header-cell>
            <mat-cell *matCellDef="let installation">
                <lab-info [lab]="installation.labId" />
            </mat-cell>
         </ng-container>

         <ng-container matColumnDef="numInstalled">
            <mat-header-cell *matHeaderCellDef>Number</mat-header-cell>
            <mat-cell *matCellDef="let installation">
                {{installation.numInstalled}}
            </mat-cell>
        </ng-container>

        <ng-container matColumnDef="actions">
            <mat-header-cell *matHeaderCellDef></mat-header-cell>
            <mat-cell *matCellDef="let installation">

                <a mat-icon-button [routerLink]="[
                    {outlets: {form: updateInstallationLink(installation)}}
                ]">
                    <mat-icon>pencil</mat-icon>
                </a>

            </mat-cell>
        </ng-container>

        <mat-header-row *matHeaderRowDef="displayedColumns()" />
        <mat-row *matRowDef="let installation; columns: displayedColumns(); " />
    </mat-table>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush

})
export class EquipmentInstallationTableComponent {
    installations = input.required<EquipmentInstallation[]>();

    displayedColumns = input<string[]>(['lab', 'numInstalled', 'actions']);

    updateInstallationLink(install: EquipmentInstallation): string[] {
        return ['/equipment-forms', 'update-installation', install.id];
    }
}