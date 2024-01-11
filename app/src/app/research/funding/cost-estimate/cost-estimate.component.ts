import { Component, Input, Pipe, PipeTransform } from '@angular/core';
import { CostEstimate } from './cost-estimate';
import { CommonModule, formatCurrency } from '@angular/common';
import { CostEstimatePipe } from './cost-estimate.pipe';

@Component({
  selector: 'uni-research-funding-cost-estimate',
  standalone: true,
  imports: [CommonModule, CostEstimatePipe],
  template: ` <span [innerHTML]="cost | uniCostEstimate: 'full'"></span> `,
})
export class ResearchFundingCostEstimateComponent {
  @Input()
  cost: CostEstimate | null;
}
