import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ResearchPlan } from './research-plan';
import { ResearchPlanResearcherInfoComponent } from '../researcher/researcher-info.component';

@Component({
  selector: 'research-plan-info',
  standalone: true,
  imports: [CommonModule, ResearchPlanResearcherInfoComponent],
  template: `
    <h1>{{ plan.title }} {{ plan.funding.description }}</h1>

    <research-plan-researcher-info [plan]="plan" />

    <!--
    <div class="process-summary">
      <p>{{ plan.processSummary }}</p>
    </div>
    -->
  `,
})
export class ResearchPlanInfoComponent {
  @Input()
  plan: ResearchPlan;
}
