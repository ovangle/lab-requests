import { Component, inject } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Observable, Subscription, combineLatest, map } from "rxjs";
import { ResourceContext, ResourceType, isResourceType } from "../../resources/common/resource";

export function typeIndexFromDetailRoute$(): Observable<[ResourceType, number | 'create']> {
    const activatedRoute = inject(ActivatedRoute);

    return combineLatest([
        activatedRoute.paramMap,
        activatedRoute.data
    ]).pipe(
        map(([paramMap, data]) => {
            const resourceType = data['resourceType']
            if (!isResourceType(resourceType)) {
                throw new Error('No resource type in route data');
            }
            let index: number | 'create' = Number.parseInt(paramMap.get('resource_index')!);
            if (Number.isNaN(index)) {
                index = 'create';
            }
            return [resourceType, index]
       })
    )
}

@Component({
    selector: 'lab-work-unit-resource-page',
    template: `
    <lab-resource-form-page-title 
        *ngIf="typeIndex$ | async as typeIndex"
        [resourceType]="typeIndex[0]"
        [index]="typeIndex[1]">
    
    </lab-resource-form-page-title>


    <ng-container [ngSwitch]="resourceType$ | async">
        <lab-equipment-lease-form *ngSwitchCase="'equipment'"></lab-equipment-lease-form>
        <lab-software-resource-form *ngSwitchCase="'software'"></lab-software-resource-form>
        <lab-service-resource-form *ngSwitchCase="'service'"></lab-service-resource-form>
        <lab-input-material-resource-form *ngSwitchCase="'input-material'"></lab-input-material-resource-form>
        <lab-output-material-resource-form *ngSwitchCase="'output-material'"></lab-output-material-resource-form>
    </ng-container>
    `,
    providers: [
        ResourceContext
    ]
})
export class WorkUnitResourceFormPage {
    readonly _context = inject(ResourceContext);
    _contextConnection: Subscription;

    readonly typeIndex$ = this._context.committedTypeIndex$;
    readonly resourceType$ = this._context.resourceType$;

    constructor() {
        this._contextConnection = this._context.sendTypeIndex(
            typeIndexFromDetailRoute$()
        );
    }

    ngOnDestroy() {
        this._contextConnection.unsubscribe();
    }

}