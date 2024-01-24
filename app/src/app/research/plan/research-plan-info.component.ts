import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ResearchPlan } from './research-plan';

@Component({
  selector: 'research-plan-info',
  standalone: true,
  imports: [ CommonModule ],
  template: `
    <h1>{{ plan!.title }} {{ plan!.funding.description }}</h1>

    <h3>Researcher</h3>
      {{plan!.researcher.name }} ({{plan!.researcher.email}})

    <!--
    <div class="process-summary">
      <p>{{ plan.processSummary }}</p>
    </div>
    -->
  `,
})
export class ResearchPlanInfoComponent {
  @Input({ required: true })
  plan: ResearchPlan | undefined;
}
