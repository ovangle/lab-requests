import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { AbstractFormGroupDirective, ControlContainer, FormControlDirective, FormControlName, FormGroupDirective, ReactiveFormsModule } from "@angular/forms";
import { AbstractResearchPlanDetailFieldComponent } from "./abstract-research-plan-form-field";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ResearchPlan } from "../research-plan";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { BehaviorSubject } from "rxjs";
import { MatInputModule } from "@angular/material/input";

@Component({
  selector: 'research-plan-form--title-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    @if (contentEditable) {
      <mat-form-field>
        <mat-label>Project title</mat-label>
        <input matInput 
              [formControl]="$any(control)" required/>

        @if (plan != null) {
          <ng-container matIconSuffix>
            <button mat-icon-button
              (click)="onSaveTitleClicked()">
              <mat-icon>check</mat-icon>
            </button>
            <button mat-icon-button
              (click)="onCancelClicked()">
              <mat-icon>close</mat-icon>
            </button>
          </ng-container>
        }

        <mat-error>
        </mat-error>
      </mat-form-field>
    } @else {
      <div class="detail-title">
        <h2>
          {{plan!.title}}
        </h2>

        <button mat-icon-button (click)="onEditTitleClicked()">
          <mat-icon>edit</mat-icon>
        </button>
      </div>
    }
  `,
  styles: `
  .detail-title {
    display: flex;
    justify-content: space-between;
  }
  `
})
export class ResearchPlanForm__TitleField extends AbstractResearchPlanDetailFieldComponent<string> {
  readonly controlName = 'title';


  onEditTitleClicked() {
    this.contentEditableToggle.emit(true);
  }

  async onSaveTitleClicked() {
    this.contentChange.emit(this.control!.value!);
    this.contentEditableToggle.emit(false);
  }

  onCancelClicked() {
    this.control!.reset();
    this.contentEditableToggle.emit(false);
  }
}
