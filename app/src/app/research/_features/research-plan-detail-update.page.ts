import { Component, inject } from "@angular/core";
import { ResearchPlanContext } from "../plan/research-plan-context";
import { ResearchPlanFormComponent } from "../plan/research-plan-form.component";
import { UserContext } from "src/app/user/user-context";
import { CommonModule } from "@angular/common";
import { map, startWith } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { ResearchPlan } from "../plan/research-plan";


@Component({
    standalone: true,
    imports: [
        CommonModule,
        ResearchPlanFormComponent
    ],
    template: `
    @if (plan$ | async; as plan) {
        <research-plan-form 
            [plan]="plan" 
            [currentUser]="currentUser!"
            (save)="_onResearchPlanSaved($event)" 
            (cancel)="_router.navigate(['..'], {relativeTo: activatedRoute})" />
    }
    `
})
export class ResearchPlanDetail__UpdatePage {
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