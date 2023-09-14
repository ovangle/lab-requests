import { Component, Injectable, inject } from "@angular/core";
import { WorkUnit, WorkUnitContext, WorkUnitModelService, WorkUnitPatch, workUnitPatchFromWorkUnit } from "../../work-unit";
import { Subscription, firstValueFrom, switchMap } from "rxjs";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { ResourceContainerContext, ResourceContainerPatch } from "../../resources/resource-container";
import { ResourceContainerForm, ResourceContainerFormService } from "../../resources/resource-container-form";
import { WorkUnitFormService } from "../../work-unit-form.service";

function workUnitContextFromFormHostRoute() {
    const activatedRoute = inject(ActivatedRoute);
    const models = inject(WorkUnitModelService);

    return activatedRoute.paramMap.pipe(
        switchMap(paramMap => {
            const workUnitId = paramMap.get('work_unit_index'); 
            if (workUnitId == null) {
                throw new Error('Work unit not found in route');
            }
            return models.fetch(workUnitId);
        })
    )
}

@Injectable()
class WorkUnitResourceContainerFormService extends ResourceContainerFormService {
    readonly _workUnitFormService = inject(WorkUnitFormService);

    get form() {
        return this._workUnitFormService.form as any;
    }
}


@Component({
    selector: 'lab-work-unit-form-outlet',
    template: `
        <router-outlet></router-outlet>
    `,
    providers: [
        {
            provide: ResourceContainerFormService,
            useClass: WorkUnitResourceContainerFormService
        }
    ]
})
export class WorkUnitResourceFormOutlet {
    _workUnitContext = inject(WorkUnitContext);
    _workUnitContextConnection: Subscription;

    constructor() {
        this._workUnitContextConnection = this._workUnitContext.sendCommitted(
            workUnitContextFromFormHostRoute()
        );
    }

    ngOnDestroy() {
        this._workUnitContextConnection.unsubscribe();
    }
}
