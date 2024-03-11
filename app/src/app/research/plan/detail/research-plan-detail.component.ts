import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ResearchPlan } from "../research-plan";
import { ResearchPlanDetail__TitleField } from "../form/research-plan-form--title-field.component";
import { BehaviorSubject } from "rxjs";
import { DisciplinePipe } from "src/app/uni/discipline/discipline.pipe";
import { ResearchPlanDetail__DescriptionField } from "../form/research-plan-form--description-field.component";
import { ResearchPlanFormComponent } from "../research-plan-form.component";

@Component({
  selector: 'research-plan-detail',
  standalone: true,
  imports: [
    CommonModule,
    DisciplinePipe,
    ResearchPlanDetail__TitleField,
    ResearchPlanDetail__DescriptionField,
  ],
  template: `
  <div class="page-header">
    <div class="page-title">
      <h1>{{plan!.discipline | uniDiscipline}} research plan</h1>
      <research-plan-detail--title-field
        [plan]="plan!"
      />
    </div>
  </div>

  <div class="page-body">
    <section class="general-info">
      <research-plan-detail--description-field
        [plan]="plan!"
      />
    </section>
    
  </div>


  `
})
export class ResearchPlanDetailComponent {
  @Input({ required: true })
  plan: ResearchPlan | undefined;

  @Output()
  save = new EventEmitter<ResearchPlan>();

  readonly form = ResearchPlanFormComponent()

  readonly editFields = new BehaviorSubject(new Set<string>());

  isEditingField(field: string): boolean {
    return this.editFields.value.has(field);
  }

}