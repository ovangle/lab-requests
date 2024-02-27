import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { EquipmentProvision } from "./equipment-provision";
import { ProvisionStatusPipe } from "./provision-status.pipe";
import { MatButtonModule } from "@angular/material/button";
import { ResearchFundingCostEstimateComponent } from "src/app/research/funding/cost-estimate/cost-estimate.component";
import { EquipmentProvisionPurchaseCostEstimateForm } from "./equipment-provision-purchase-cost-estimate.form";


@Component({
    selector: 'equipment-provision-card',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,

        ProvisionStatusPipe,
        ResearchFundingCostEstimateComponent,
        EquipmentProvisionPurchaseCostEstimateForm,
    ],
    template: `
    <mat-card>
        <mat-card-header>
            <mat-card-title>
                Equipment provision
                <mat-card-subtitle>{{provision!.status | provisionStatus}}</mat-card-subtitle>
            </mat-card-title>
        </mat-card-header>
        <mat-card-content>
            <p>Items required {{provision!.quantityRequired}}</p>

            <p>{{provision!.reason}}</p>

            @if (!isEditingCostEstimates) {
                @if (canEditCostEstimates) {
                    <button mat-button (click)="_onEditCostEstimatesClick()"> 
                        Add/edit cost estimates
                    </button>
                }
            } @else {
                <equipment-provision-purchase-cost-estimate-form
                    [provision]="provision!" 
                    (save)="provision = $event; save.emit($event)" />
            }

        </mat-card-content>
        <mat-card-actions>
            @for (action of availableActions; track action) {
                <button mat-button (click)="_onProvisionActionClick(action)">
                    {{action}}
                </button>
            }
        </mat-card-actions>
    </mat-card>
    `,
    styles: `
    mat-card-title {
        margin-left: 0;
        padding-left: 0;
    }

    `
})
export class EquipmentProvisionCardComponent {
    @Input({ required: true })
    provision: EquipmentProvision | undefined;

    @Output()
    save = new EventEmitter<EquipmentProvision>();

    get availableActions(): string[] {
        switch (this.provision!.status) {
            case 'requested':
                return [ 'APPROVE', 'DENY' ];
            case 'approved':
                return [ 'PURCHASE' ]
            case 'purchased':
                return [ 'INSTALL' ]
            default:
                return [];
        }
    }

    _onProvisionActionClick(action: string) { }


    isEditingCostEstimates = false;

    get canEditCostEstimates() {
        return [ 'requested' ].includes(this.provision!.status);
    }

    _onEditCostEstimatesClick() {
        this.isEditingCostEstimates = true;
    }

    _onCostEstimateSave(provision: EquipmentProvision) {
        this.provision = provision;
        this.save.next(provision);
    }
}