import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { LabEquipmentProvision } from "./equipment-provision";
import { NewEquipmentRequestFormComponent } from "./provision-new-equipment-form.component";
import { LabEquipmentProvisionInfoComponent } from "../../lab/equipment/provision/equipment-provision-info.component";
import { MatIconModule } from "@angular/material/icon";
import { Equipment } from "../equipment";
import { Lab } from "../../lab/lab";
import { ResearchFunding } from "src/app/research/funding/research-funding";

@Component({
    selector: 'lab-equipment-provision-flow-card',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,

        LabEquipmentProvisionInfoComponent,
        NewEquipmentRequestFormComponent
    ],
    template: `
    <mat-card>
        <mat-card-header>
        @if (provision) {
            Requested equipment
        } @else {
            New equipment request
            <button mat-icon-button (click)="provisionCancel.emit()">
              <mat-icon>cancel</mat-icon>
            </button>
        }
        </mat-card-header>
        <mat-card-content>
        @if (!provision) {
            <equipment-provision-new-equipment-form
                [equipment]="equipment"
                [lab]="lab"
                [funding]="funding!"
                (save)="provisionCreate.emit($event)"
            />
        } @else {
            
        }
        </mat-card-content>
        <mat-card-footer>
            @switch (provision?.status) {

            }

        </mat-card-footer>
    </mat-card>
    `
})
export class LabEquipmentProvisionFlowCardComponent {
    @Input()
    equipment: Equipment | null = null;

    @Input()
    lab: Lab | null = null;

    @Input()
    funding: ResearchFunding | undefined;

    @Input()
    provision: LabEquipmentProvision | null = null;

    @Output()
    provisionCreate = new EventEmitter<LabEquipmentProvision>();

    @Output()
    provisionCancel = new EventEmitter<void>();
}