import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { EquipmentProvision } from "./equipment-provision";
import { ProvisionStatusPipe } from "./provision-status.pipe";
import { MatButtonModule } from "@angular/material/button";
import { ResearchFundingCostEstimateComponent } from "src/app/research/funding/cost-estimate/cost-estimate.component";
import { CostEstimate } from "src/app/research/funding/cost-estimate/cost-estimate";
import { CostEstimateForm, ResearchFundingCostEstimateFormComponent, costEstimateForm, setCostEstimateFormValue } from "src/app/research/funding/cost-estimate/cost-estimate-form.component";


@Component({
    selector: 'equipment-provision-card',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,

        ProvisionStatusPipe,
        ResearchFundingCostEstimateComponent,
        ResearchFundingCostEstimateFormComponent
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

            @if (provision!.resolveFunding() | async; as funding) {
                <research-funding-cost-estimate
                    [funding]="funding"
                    [perUnitCost]="provision!.estimatedCost || 0"
                    [quantityRequired]="provision!.quantityRequired" />
            } @else if (_costEstimateForm) {
                <research-funding-cost-estimate-form
                    [form]="_costEstimateForm"
                    [funding]="funding"
                    [perUnitCost]="provision!.estimatedCost" />
            } @else {
                <button mat-button (click)="_onAddCostEstimatesClick()"> 
                    Add cost estimates
                </button>
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

    get availableActions(): string[] {
        switch (this.provision!.status) {
            case 'requested':
                return [ 'APPROVE', 'DENY' ];
            default:
                return [];
        }
    }

    _onProvisionActionClick(action: string) { }

    get costEstimate(): CostEstimate | null {
        if (this.provision!.funding) {
            return {
                isUniversitySupplied: true,
                perUnitCost: this.provision!.estimatedCost || 0,
                unit: 'item',
                quantityRequired: this.provision!.quantityRequired
            };
        }
        return null;
    }

    _costEstimateForm: CostEstimateForm | undefined = undefined;

    _onAddCostEstimateClick() {
        this._costEstimateForm = costEstimateForm();
        setCostEstimateFormValue(this._costEstimateForm, this.costEstimate);
    }
}