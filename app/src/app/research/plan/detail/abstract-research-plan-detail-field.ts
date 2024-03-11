import { Directive, Input, forwardRef, inject } from "@angular/core";
import { ResearchPlanDetailComponent } from "./research-plan-detail.component";
import { ResearchPlan } from "../research-plan";
import { BehaviorSubject } from "rxjs";
import { ResearchPlanContext } from "../research-plan-context";
import { ControlContainer, FormGroupDirective } from "@angular/forms";
import { ResearchPlanForm } from "../research-plan-form.component";

@Directive()
export abstract class AbstractResearchPlanDetailFieldComponent {
  abstract readonly name: keyof ResearchPlanForm['controls'];

  @Input({ required: true })
  plan: ResearchPlan | null = null;

  readonly controlContainer: ControlContainer = inject(FormGroupDirective);

  get planForm(): ResearchPlanForm | null {
    return this.controlContainer.control as ResearchPlanForm | null;
  }

  get control() {
    return this.planForm?.controls[this.name];
  }


}