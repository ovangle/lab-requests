import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampusInfoComponent } from 'src/app/uni/campus/campus-info.component';
import { Discipline } from 'src/app/uni/discipline/discipline';
import { ResearchPlan } from '../common/research-plan';
import { Campus } from 'src/app/uni/campus/common/campus';
import { DisciplinePipe } from 'src/app/uni/discipline/discipline.pipe';

@Component({
  selector: 'research-plan-researcher-info',
  standalone: true,
  imports: [CommonModule, CampusInfoComponent, DisciplinePipe,],
  template: `
    <h4>{{ email }}</h4>
    <dl>
      <dt>Base campus</dt>
      <dd><uni-campus-info [campus]="baseCampus"></uni-campus-info></dd>
      <dt>Discipline</dt>
      <dd>
        @for (discipline of disciplines; track discipline) {
          {{discipline | uniDiscipline}}
        }
      </dd>
    </dl>
  `,
})
export class ResearchPlanResearcherInfoComponent {
  @Input({ required: true }) plan: ResearchPlan | undefined;

  get email(): string {
    return this.plan!.researcher.email;
  }

  get baseCampus(): Campus {
    return this.plan!.researcher.baseCampus;
  }

  get disciplines(): ReadonlySet<Discipline> {
    return this.plan!.researcher.disciplines;
  }
}
