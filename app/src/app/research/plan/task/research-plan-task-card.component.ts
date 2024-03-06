import { Component, Input, inject } from "@angular/core";
import { ResearchPlanTask, ResearchPlanTaskParams } from "./research-plan-task";
import { CommonModule } from "@angular/common";
import { Lab, LabService } from "src/app/lab/lab";
import { BehaviorSubject, distinctUntilChanged, filter, switchMap } from "rxjs";
import { MatCardModule } from "@angular/material/card";
import { User, UserService } from "src/app/user/common/user";
import { UserInfoComponent } from "src/app/user/user-info.component";

@Component({
  selector: 'research-plan-task-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    UserInfoComponent
  ],
  template: `
  <mat-card>
    <mat-card-content>
      <div class="index">
        <b>{{task!.index + 1}}.</b>
      </div>
      <div class="task-info">
        <div class="task-description">
          {{task!.description}}
        </div>
        <div class="task-lab-supervisor">
          <div class="task-lab">
            <b>Lab</b>&nbsp;{{(lab$ | async)?.name}}
          </div>
          <div class="task-supervisor">
            @if (supervisor$ | async; as supervisor) {
              <b>Supervisor</b>&nbsp;<user-info [user]="supervisor" nameonly />
            }
          </div>
        </div>
      </div>
    </mat-card-content>
  </mat-card>
  `,
  styles: `
  mat-card-content, .task-lab-supervisor {
    display: flex;
  }
  .task-info, .task-lab, .task-supervisor {
    flex-grow: 1;
  }
  .task-description {
    margin-bottom: 0.5em;
  }
    .index {
        padding-right: 1em;
    }
    
    .task-lab-supervisor {
        display: flex;
    }
    `
})
export class ResearchPlanTaskCardComponent {
  _labService = inject(LabService);
  _userService = inject(UserService);

  _taskSubject = new BehaviorSubject<ResearchPlanTask | null>(null);

  @Input({ required: true })
  get task(): ResearchPlanTask {
    return this._taskSubject.value!;
  }
  set task(task: ResearchPlanTask) {
    this._taskSubject.next(task);
  }

  readonly lab$ = this._taskSubject.pipe(
    filter((t): t is ResearchPlanTask => t != null),
    distinctUntilChanged(),
    switchMap(task => task.resolveLab(this._labService))
  )

  readonly supervisor$ = this._taskSubject.pipe(
    filter((t): t is ResearchPlanTask => t != null),
    distinctUntilChanged(),
    switchMap(task => task.resolveSupervisor(this._userService))
  );

  ngOnDestroy() {
    this._taskSubject.complete();
  }
}