import { Component, Injectable, inject } from "@angular/core";
import { ExperimentalPlanContext } from "../experimental-plan";
import { Subscription, map, of } from "rxjs";

import { WorkUnitFormComponent } from "./work-unit-patch-form.component";
import { CommonModule } from "@angular/common";
import { WorkUnitContext } from "./work-unit";
import { Validators } from "@angular/forms";

@Injectable()
export class WorkUnitCreateContext extends WorkUnitContext {
    override fromContext$ = of(null);
}


@Component({
    selector: 'app-experimental-work-unit-create-page',
    standalone: true,
    imports: [
        CommonModule,
        WorkUnitFormComponent
    ],
    template: `
    <form [formGroup]="form">
    </form>
    `,
    providers: [
        { provide: WorkUnitContext, useClass: WorkUnitCreateContext }
    ]
})
export class WorkUnitCreateFormComponent {
    readonly planContext = inject(ExperimentalPlanContext);
    readonly plan$ = this.planContext.plan$;

}