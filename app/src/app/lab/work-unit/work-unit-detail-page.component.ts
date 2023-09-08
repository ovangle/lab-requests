import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { WorkUnitContext } from "./work-unit";
import { ActivatedRoute } from "@angular/router";
import { switchMap, withLatestFrom } from "rxjs";

class WorkUnitContextError extends Error {}

class WorkUnitContextFromDetailRoute extends WorkUnitContext {
    readonly activatedRoute = inject(ActivatedRoute);

    override readonly fromContext$ = this.plan$.pipe(
        withLatestFrom(this.activatedRoute.paramMap),
        switchMap(([plan, params]) => {
            if (plan != null) {
                const workUnitIndex = Number.parseInt(params.get('work_unit_index')!);
                if (Number.isNaN(workUnitIndex)) {
                    throw new WorkUnitContextError('Invalid route. Expected :work_unit_index in params');
                }

                return this.models.readByPlanAndIndex(plan, workUnitIndex);
            } else {
                const workUnitId = params.get('work_unit_id');
                if (typeof workUnitId != 'string') {
                    throw new WorkUnitContextError('Invalid route. Expected :work_unit_index in params');
                }
                return this.models.readById(workUnitId);
            }
        })
    );
}


@Component({
    standalone: true,
    imports: [
        CommonModule
    ],
    template: ``,
    providers: [
        {   
            provide: WorkUnitContext, 
            useClass: WorkUnitContextFromDetailRoute 
        }
    ]
})
export class WorkUnitDetailPage {
}