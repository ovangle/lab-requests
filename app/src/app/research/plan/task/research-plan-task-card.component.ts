import { firstValueFrom } from "rxjs";
import { Component, Input, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogContent, MatDialogModule, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';

import { User, UserService } from "src/app/user/common/user";
import { ResearchPlanTask } from "./research-plan-task";
import { Lab, LabService } from "src/app/lab/lab";
import { MatCardModule } from "@angular/material/card";
import { UserInfoComponent } from "src/app/user/user-info.component";
import { ResearchPlan, ResearchPlanService } from "../research-plan";
import { ResearchPlanTaskForm, ResearchPlanTaskFormComponent, createResearchPlanTaskFromForm, researchPlanTaskForm } from "./research-plan-task-form.component";
import { ResearchPlanTaskDetailComponent } from "./research-plan-task-detail.component";
import { ResearchPlanContext } from "../research-plan-context";


@Component({
  selector: 'research-plan-task-card',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    UserInfoComponent,
    ResearchPlanTaskDetailComponent,
    ResearchPlanTaskFormComponent
  ],
  template: `
  <mat-card>
    <mat-card-content>
      <div class="task-index">
        <b>{{task!.index + 1}}.</b>
      </div>
      <div class="task-info">
        @if (form) {
          <research-plan-task-form [form]="form" [index]="task!.index" />
        } @else {
          <research-plan-task-detail [task]="task!" />
        }
      </div>
    </mat-card-content>
    <mat-card-footer>
      @if (form) {
        <button mat-button color="primary"
                [disabled]="!form.valid"
                (click)="onSaveButtonClick()">
          SAVE
        </button>
        <button mat-button color="warn"
                (click)="onCancelButtonClick()">
          CANCEL
        </button>
      } @else {
        <button mat-button 
                color="primary"
                (click)="onEditButtonClick()">
          EDIT
        </button>
        <button mat-button
                color="warn"
                (click)="onDeleteButtonClick()">
          DELETE
        </button>
      }
    </mat-card-footer>
  </mat-card>
  `,
  styles: `
  mat-card-content {
    display: flex;
    padding-left: 1.5em;
  }
  .task-index {
    margin-right: 1em;
  }
  .task-info {
    flex-grow: 1;
  }
  mat-card-footer {
    display: flex;
    justify-content: end;
  }
    `
})
export class ResearchPlanTaskCardComponent {
  _labService = inject(LabService);
  _userService = inject(UserService);

  _planService = inject(ResearchPlanService);
  _planContext = inject(ResearchPlanContext);

  _dialog = inject(MatDialog);

  @Input({ required: true })
  task: ResearchPlanTask | undefined;

  form: ResearchPlanTaskForm | null = null;

  async onEditButtonClick() {
    const lab = await this.task!.resolveLab(this._labService);
    const supervisor = await this.task!.resolveSupervisor(this._userService);
    this.form = researchPlanTaskForm(this.task);
    this.form.patchValue({ lab, supervisor });
  }

  async onDeleteButtonClick() {
    const dialogRef = this._dialog.open(ResearchPlanConfirmDeleteDialog, {
      data: { task: this.task! }
    });
    const isConfirmed = await firstValueFrom(dialogRef.afterClosed());
    if (isConfirmed) {
      const plan = await firstValueFrom(this._planService.removeTask(this.task!));
      this._planContext.nextCommitted(plan);
    }
  }

  async onSaveButtonClick() {
    const plan = await firstValueFrom(this._planService.updateTask(this.task!, createResearchPlanTaskFromForm(this.form!)));
    this._planContext.nextCommitted(plan);
    this.form = null;
  }

  onCancelButtonClick() {
    this.form = null;
  }
}

@Component({
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions
  ],
  template: `
  <h2 mat-dialog-title>Confirm</h2>
  <mat-dialog-content>
    <p>Are you sure you want to remove the task at {{task.index + 1}}?</p>
  </mat-dialog-content>
  <mat-dialog-actions>
    <button mat-button (click)="onYesButtonClicked()" cdkFocusInitial>YES</button>
    <button mat-button (click)="onNoButtonClicked()">NO</button>
  </mat-dialog-actions>
  `
})
export class ResearchPlanConfirmDeleteDialog {
  readonly ref = inject(MatDialogRef<{ task: ResearchPlanTask }>);

  readonly data: { task: ResearchPlanTask } = inject(MAT_DIALOG_DATA);

  get task() {
    return this.data.task;
  }

  onYesButtonClicked() {
    this.ref.close(true);
  }

  onNoButtonClicked() {
    this.ref.close(false);
  }
}