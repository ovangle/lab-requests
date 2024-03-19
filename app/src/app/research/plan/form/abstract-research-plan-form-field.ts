import { Directive, EventEmitter, Input, Output, inject } from "@angular/core";
import { ResearchPlan } from "../research-plan";
import { AbstractControl, ControlContainer, FormGroupDirective, ValidationErrors } from "@angular/forms";
import { ResearchPlanForm } from "../research-plan-form.component";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";

@Directive()
export abstract class AbstractResearchPlanDetailFieldComponent<TValue> {
  abstract readonly controlName: keyof ResearchPlanForm[ 'controls' ];

  @Input({ required: true })
  plan: ResearchPlan | null = null;

  @Input({ required: true })
  get contentEditable(): boolean {
    return this._contentEditable;
  }
  set contentEditable(value: BooleanInput) {
    this._contentEditable = coerceBooleanProperty(value);
  }
  _contentEditable: boolean = false

  @Output()
  contentChange = new EventEmitter<TValue>();

  @Output()
  contentEditableToggle = new EventEmitter<boolean>();

  readonly controlContainer: ControlContainer = inject(FormGroupDirective);

  get planForm(): ResearchPlanForm | null {
    return this.controlContainer.control as ResearchPlanForm | null;
  }

  get control(): AbstractControl<TValue, TValue> | null {
    if (this.planForm && this._contentEditable) {
      return this.planForm.controls[ this.controlName ] as any;
    }
    return null;
  }

  get errors(): ValidationErrors | null {
    if (this.planForm) {
      return this.planForm.controls[ this.controlName ]?.errors || null;
    }
    return null;
  }
}