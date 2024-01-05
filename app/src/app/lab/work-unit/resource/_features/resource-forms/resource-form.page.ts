import { Component, inject } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Observable, Subscription, combineLatest, defer, map } from "rxjs";
import { Block } from "@angular/compiler";
import { ResourceType, isResourceType } from "../../resource-type";
import { ResourceContext } from "../../resource";
import { ResourceFormService } from "../../resource-form.service";
import { BodyScrollbarHidingService } from "src/app/utils/body-scrollbar-hiding.service";
import { ExperimentalPlanFormPaneControlService } from "src/app/lab/experimental-plan/experimental-plan-form-pane-control.service";
import { WorkUnit, WorkUnitContext } from "../../../common/work-unit";
import { ResourceContainer, ResourceContainerContext } from "../../resource-container";
import { FundingModel } from "src/app/uni/research/funding/funding-model";

export function typeIndexFromDetailRoute$(): Observable<[ ResourceType, number | 'create' ]> {
    const activatedRoute = inject(ActivatedRoute);

    return combineLatest([
        activatedRoute.paramMap,
        activatedRoute.data
    ]).pipe(
        map(([ paramMap, data ]) => {
            const resourceType = data[ 'resourceType' ]
            if (!isResourceType(resourceType)) {
                throw new Error('No resource type in route data');
            }
            let index: number | 'create' = Number.parseInt(paramMap.get('resource_index')!);
            if (Number.isNaN(index)) {
                index = 'create';
            }
            return [ resourceType, index ]
        })
    )
}

@Component({
    selector: 'lab-work-unit-resource-form-page',
    template: `
    @if (_formService.isReady | async; as typeIndex) {
        @if (containerName$ | async; as containerName) {
            <lab-resource-form-title
                [containerName]="containerName"
                [resourceType]="_formService.resourceType"
                [resourceIndex]="_formService.resourceIndex"
                [saveDisabled]="!_formService.form.valid"
                (requestClose)="close()"
                (requestSave)="saveAndClose()">
            </lab-resource-form-title>
        }

        @if (containerId$ | async; as containerId) {

            @if (fundingModel$ | async; as fundingModel) {
                @switch (typeIndex[0]) {

                    @case('equipment') {
                        <lab-equipment-lease-form
                            [workUnitId]="containerId"
                            [fundingModel]="fundingModel" />
                    }

                    @case ('software') {
                        <lab-software-resource-form />
                    }

                    @case ('task') {
                        <lab-task-resource-form />
                    }

                    @case ('input-material') {
                        <lab-input-material-resource-form />
                    }

                    @case ('output-material') {
                        <lab-output-material-resource-form />
                    }
                }
            }
        }
    }
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

    readonly containerId$: Observable<string> = this._context.container$.pipe(
        map((container: ResourceContainer) => container.id)
    );
    readonly containerName$: Observable<string> = this._context.container$.pipe(
        map((container: ResourceContainer) => container.name)
    );

    readonly fundingModel$: Observable<FundingModel> = this._context.plan$.pipe(
        map(plan => plan.fundingModel)
    );

    constructor() {
        this._contextConnection = this._context.sendTypeIndex(
            typeIndexFromDetailRoute$()
        );
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