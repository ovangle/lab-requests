import { Component, Input, inject } from "@angular/core";
import { ResearchPlanTask, ResearchPlanTaskParams } from "./research-plan-task";
import { CommonModule } from "@angular/common";
import { LabService } from "src/app/lab/lab";
import { BehaviorSubject, filter, switchMap } from "rxjs";

@Component({
    selector: 'research-plan-task-info',
    standalone: true,
    imports: [
        CommonModule
    ],
    template: `
    <div class="task-index">{{task!.index + 1}}.</div> 

    <div class="task-lab">{{lab$ | async}}</div>

    <div class="description">
        {{task!.description}}
    </div>
    `
})
export class ResearchPlanTaskInfoComponent {
    _labService = inject(LabService);

    _taskSubject = new BehaviorSubject<ResearchPlanTask | null>(null);

    @Input({ required: true })
    get task(): ResearchPlanTask | null {
        return this._taskSubject.value;
    }
    set task(task: ResearchPlanTask) {
        this._taskSubject.next(task);
    }

    readonly lab$ = this._taskSubject.pipe(
        filter((t): t is ResearchPlanTask => t != null),
        switchMap(task => task.resolveLab(this._labService))
    )

    ngOnDestroy() {
        this._taskSubject.complete();
    }




}