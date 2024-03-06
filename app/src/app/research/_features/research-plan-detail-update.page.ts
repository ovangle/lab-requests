import { Component, inject } from "@angular/core";
import { ResearchPlanContext } from "../plan/research-plan-context";
import { ResearchPlanFormComponent } from "../plan/research-plan-form.component";
import { UserContext } from "src/app/user/user-context";
import { CommonModule } from "@angular/common";
import { map, startWith } from "rxjs";


@Component({
    standalone: true,
    imports: [
        CommonModule,
        ResearchPlanFormComponent
    ],
    template: `
    @if (plan$ | async; as plan) {
        @if (currentUser$ | async; as currentUser) {
            <research-plan-form 
                [plan]="plan" 
                [currentUser]="currentUser"
                (save)="context.nextCommitted($event)" />
        }
    }
    `
})
export class ResearchPlanDetail__UpdatePage {
    readonly _userContext = inject(UserContext);
    readonly context = inject(ResearchPlanContext);

    readonly plan$ = this.context.committed$;

    readonly currentUser$ = this._userContext.committed$;

    readonly currentUserPlanRole$ = this.currentUser$.pipe(
        map(user => user.roles.has('student') ? 'researcher' : 'coordinator'),
    );
}