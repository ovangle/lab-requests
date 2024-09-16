import { Component, inject } from "@angular/core";
import { ResearchPlanContext } from "../plan/research-plan-context";
import { ResearchPlanFormComponent } from "../plan/research-plan-form.component";
import { UserContext } from "src/app/user/user-context";
import { CommonModule } from "@angular/common";
import { map, startWith } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { ResearchPlan } from "../plan/research-plan";
import { ResearchPlanTaskCardComponent } from "../plan/task/research-plan-task-card.component";


@Component({
    standalone: true,
    imports: [
        CommonModule,
        ResearchPlanTaskCardComponent
    ],
    template: `
    @if (plan$ | async; as plan) {
        @for (task of plan.tasks.items; track task.index) {
            <research-plan-task-card [task]="task" />
        }
    }
    `
})
export class ResearchPlanDetail__TasksPage {
    _router = inject(Router);
    activatedRoute = inject(ActivatedRoute);
    readonly _userContext = inject(UserContext);
    readonly context = inject(ResearchPlanContext);

    readonly plan$ = this.context.committed$;

    get currentUser() {
        return this._userContext.currentUser;
    }
    readonly currentUser$ = this._userContext.committed$;

    _onResearchPlanSaved(plan: ResearchPlan) {
        this.context.nextCommitted(plan);
        this._router.navigate([ '..' ], { relativeTo: this.activatedRoute });
    }
}