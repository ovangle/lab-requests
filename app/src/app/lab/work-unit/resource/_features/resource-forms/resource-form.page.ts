import { Component, inject } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Observable, Subscription, combineLatest, defer, map } from "rxjs";
import { Block } from "@angular/compiler";
import { ResourceType, isResourceType } from "../../resource-type";
import { ResourceContext } from "../../resource";
import { ResourceFormService } from "../../resource-form.service";
import { BodyScrollbarHidingService } from "src/app/utils/body-scrollbar-hiding.service";
import { ExperimentalPlanFormPaneControlService } from "src/app/lab/experimental-plan/experimental-plan-form-pane-control.service";
import { WorkUnitContext } from "../../../common/work-unit";
import { ResourceContainerContext } from "../../resource-container";

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
    selector: 'lab-work-unit-resource-form-page',
    template: `
    <ng-container *ngIf="_formService.isReady | async as typeIndex">
        <lab-resource-form-title
            *ngIf="_context.containerName$ | async as containerName"
            [containerName]="containerName"
            [resourceType]="_formService.resourceType"
            [resourceIndex]="_formService.resourceIndex"
            [saveDisabled]="!_formService.form.valid"
            (requestClose)="close()"
            (requestSave)="saveAndClose()">
        </lab-resource-form-title>

        <ng-container [ngSwitch]="typeIndex[0]">
            <lab-equipment-lease-form *ngSwitchCase="'equipment'"></lab-equipment-lease-form>
            <lab-software-resource-form *ngSwitchCase="'software'"></lab-software-resource-form>
            <lab-task-resource-form *ngSwitchCase="'task'"></lab-task-resource-form>
            <lab-input-material-resource-form *ngSwitchCase="'input-material'"></lab-input-material-resource-form>
            <lab-output-material-resource-form *ngSwitchCase="'output-material'"></lab-output-material-resource-form>
        </ng-container>
    </ng-container>
    `,
    providers: [
        ResourceContext,
        ResourceFormService
    ]
})
export class WorkUnitResourceFormPage {
    readonly _context = inject(ResourceContext);
    readonly _contextConnection: Subscription;

    readonly _formService = inject(ResourceFormService);
    readonly _formConnection: Subscription;

    readonly _formPane = inject(ExperimentalPlanFormPaneControlService);

    readonly typeIndex$ = defer(() => this._context.committedTypeIndex$);
    readonly resourceType$ = defer(() => this._context.resourceType$);

    constructor() {
        this._contextConnection = this._context.sendTypeIndex(
            typeIndexFromDetailRoute$()
        );
        this._context.container$.subscribe(container => {
            console.log('container', container);
        })

        this._formConnection = this._formService.connect();
    }

    ngOnDestroy() {
        this._contextConnection.unsubscribe();
        this._formConnection.unsubscribe();
    }

    async close() {
        this._formPane.close();
    }
    async saveAndClose() {
        await this._formService.save();
        await this.close();
    }
}