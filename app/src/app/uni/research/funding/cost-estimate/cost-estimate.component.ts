import { Component, Input } from "@angular/core";
import { CostEstimate } from "./cost-estimate";
import { CommonModule } from "@angular/common";


@Component({
    selector: 'uni-research-funding-cost-estimate',
    standalone: true,
    imports: [
        CommonModule,
    ],
    template: `
    `
})
export class ResearchFundingCostEstimateComponent {
    @Input()
    estimate: CostEstimate;
}