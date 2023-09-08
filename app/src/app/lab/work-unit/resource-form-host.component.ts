import { Component, Injectable, inject } from "@angular/core";
import { WorkUnit, WorkUnitContext } from "./work-unit";
import { Observable, switchMap } from "rxjs";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { WorkUnitsModule } from "./work-unit.feature";


@Injectable()
export class WorkUnitResourceFormContext extends WorkUnitContext {
    readonly activatedRoute = inject(ActivatedRoute);

    override readonly fromContext$ = this.activatedRoute.paramMap.pipe(
        switchMap(paramMap => {
            const workUnitId = paramMap.get('work_unit_id'); 
            if (workUnitId == null) {
                throw new Error('Work unit not found in route');
            }
            return this.models.fetch(workUnitId);
        })
    );
}

@Component({
    selector: 'lab-work-unit-resource-form-host',
    standalone: true,
    imports: [
        CommonModule,
        WorkUnitsModule
    ],
    template: `
        <router-outlet></router-outlet>
    `,
    styles: [``],
    providers: [
        { 
            provide: WorkUnitContext, 
            useClass: WorkUnitResourceFormContext
        }
    ]
})
export class WorkUnitResourceFormOutlet {}