import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { ResearchPlan } from './research-plan';

@Component({
  selector: 'research-plan-list',
  standalone: true,
  imports: [CommonModule, MatListModule],
  template: ``,
})
export class ResearchPlanListComponent {
  @Input({ required: true })
  plans: readonly ResearchPlan[];
}
