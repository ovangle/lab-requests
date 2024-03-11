import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { AbstractFormGroupDirective, ControlContainer, FormControlDirective, FormControlName, FormGroupDirective, ReactiveFormsModule } from "@angular/forms";
import { AbstractResearchPlanDetailFieldComponent } from "../detail/abstract-research-plan-detail-field";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ResearchPlan } from "../research-plan";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { BehaviorSubject } from "rxjs";

@Component({
  selector: 'research-plan-detail--title-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,

  ],
  template: `
    @if (isEditing) {
      <mat-form-field>
        <mat-label>Project title</mat-label>
        <input matInput formControlName="title" required/>

        @if (plan != null) {
          <ng-container matIconSuffix>
            <button mat-icon-button>
              (click)="onSaveTitleClicked()">
              <mat-icon>check</mat-icon>
            </button>
            <button mat-icon-button>
              (click)="onCancelClicked()"
            </button>
          </ng-container>
        }

        <mat-error>
        </mat-error>
      </mat-form-field>

    
    } @else {
      <div class="detail-title">
        <h2>
          <em>Project title</em>&nbsp;{{plan!.title}}
        </h2>

        <button mat-icon-button>
          (click)="onEditTitleClicked()">
          <mat-icon>pencil</mat-icon>
        </button>
      </div>
    }
  `,
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: FormGroupDirective
    }
  ]
})
export class ResearchPlanDetail__TitleField extends AbstractResearchPlanDetailFieldComponent {
  readonly name = 'title';

  readonly isEditingSubject = new BehaviorSubject<boolean>(false);

  get isEditing() {
    return this.isEditingSubject.value;
  }

  @Output()
  onSaveClicked = new EventEmitter();

  onEditButtonClicked() {
    this.isEditingSubject.next(true);
  }

  async onSaveTitleClicked() {
    this.onSaveClicked.emit();
    this.isEditingSubject.next(false);
  }

  onCancelClicked() {
    this.isEditingSubject.next(true);
  }
}
