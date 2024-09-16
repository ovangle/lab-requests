import { CommonModule } from "@angular/common";
import { Component, inject, Input } from "@angular/core";
import { BehaviorSubject, filter, distinctUntilChanged, shareReplay, switchMap } from "rxjs";
import { LabService } from "src/app/lab/lab";
import { UserService } from "src/app/user/user";
import { UserInfoComponent } from "src/app/user/user-info.component";
import { ResearchPlanTask } from "./research-plan-task";

@Component({
  selector: 'research-plan-task-detail',
  standalone: true,
  imports: [
    CommonModule,
    UserInfoComponent,
  ],
  template: `

        <div class="task-info">
          <div class="task-description">
            {{task!.description}}
          </div>
          <div class="task-lab-supervisor">
            <div class="task-lab">
              @if (lab$ | async; as lab) {
                <b>Lab</b>&nbsp;{{lab.name}}
              }
            </div>
            <div class="task-supervisor">
              <b>Supervisor</b>&nbsp;
              @if (supervisor$ | async; as supervisor) {
                <user-info [user]="supervisor" nameonly />
              }
            </div>
          </div>
        </div>
    `,
  styles: `
    :host, .task-lab-supervisor {
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
export class ResearchPlanTaskDetailComponent {
  _labService = inject(LabService);
  _userService = inject(UserService);

  taskSubject = new BehaviorSubject<ResearchPlanTask | null>(null);

  readonly task$ = this.taskSubject.pipe(
    filter((t): t is ResearchPlanTask => t != null),
    distinctUntilChanged(),
    shareReplay(1)
  );

  @Input()
  get task(): ResearchPlanTask {
    return this.taskSubject.value!;
  }
  set task(task: ResearchPlanTask) {
    this.taskSubject.next(task);
  }

  readonly lab$ = this.task$.pipe(
    switchMap(t => t.resolveLab(this._labService)),
  );

  readonly supervisor$ = this.task$.pipe(
    switchMap(t => t.resolveSupervisor(this._userService)),
  );

  ngOnDestroy() {
    this.taskSubject.complete();
  }
}
