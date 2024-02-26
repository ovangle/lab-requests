import { Component, Input, Pipe, PipeTransform } from '@angular/core';
import { CostEstimate } from './cost-estimate';
import { CommonModule, formatCurrency } from '@angular/common';
import { CostEstimatePipe } from './cost-estimate.pipe';
import { ResearchFunding } from '../research-funding';

@Component({
  selector: 'research-funding-cost-estimate',
  standalone: true,
  imports: [ CommonModule, CostEstimatePipe ],
  template: ` <span [innerHTML]="cost | uniCostEstimate: 'full'"></span> `,
})
export class ResearchFundingCostEstimateComponent {
  @Input()
  cost: CostEstimate | null = null;

  @Input()
  funding: ResearchFunding | null = null;

  @Input()
  perUnitCost: number = 0;

  @Input()
  quantityRequired: number = 0;
}
