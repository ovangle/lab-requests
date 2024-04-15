import { Injectable, Provider, inject } from "@angular/core";
import { ModelContext } from "src/app/common/model/context";
import { ResearchPlan, ResearchPlanService } from "./research-plan";
import { ActivatedRoute } from "@angular/router";
import { roundToNearestMinutes } from "date-fns";
import { firstValueFrom, map, tap } from "rxjs";
import { LabResourceConsumerDelegateContext } from "src/app/lab/lab-resource-consumer/resource-container";
import { Resource, ResourcePatch } from "src/app/lab/lab-resource/resource";
import { ResourceType } from "src/app/lab/lab-resource/resource-type";



@Injectable()
export class ResearchPlanContext extends ModelContext<ResearchPlan> implements LabResourceConsumerDelegateContext<ResearchPlan> {
    override readonly service = inject(ResearchPlanService);

    async appendResource<T extends Resource>(resourceType: ResourceType & T[ "type" ], params: ResourcePatch<T>): Promise<ResearchPlan> {
        const plan = await firstValueFrom(this.committed$);
        return await firstValueFrom(
            this.service.appendResource(plan, resourceType, params).pipe(
                tap(updated => this.nextCommitted(updated))
            )
        );
    }
    async insertResourceAt<T extends Resource>(resourceType: ResourceType & T[ "type" ], index: number, params: ResourcePatch<T>): Promise<ResearchPlan> {
        const plan = await firstValueFrom(this.committed$);
        return await firstValueFrom(this.service.insertResourceAt(plan, resourceType, index, params).pipe(
            tap((updated) => this.nextCommitted(updated))
        ));
    }
    async updateResourceAt<T extends Resource>(resourceType: ResourceType & T[ "type" ], index: number, params: ResourcePatch<T>): Promise<ResearchPlan> {
        const plan = await firstValueFrom(this.committed$);
        return await firstValueFrom(this.service.updateResourceAt(plan, resourceType, index, params).pipe(
            tap((updated) => this.nextCommitted(updated))
        ));
    }
    async deleteResourceAt(resourceType: ResourceType, index: number): Promise<ResearchPlan> {
        const plan = await firstValueFrom(this.committed$);
        return await firstValueFrom(this.service.deleteResourceAt(plan, resourceType, index).pipe(
            tap((updated) => this.nextCommitted(updated))
        ));
    }
}

export function provideResearchPlanDetailContext(): Provider {
    console.log('providing researcher plan detail context');
    return {
        provide: ResearchPlanContext,
        useFactory: (route: ActivatedRoute) => {
            const researchPlanIndex = route.firstChild!.firstChild!;
            const detailRoute = researchPlanIndex.firstChild!;

            const context = new ResearchPlanContext();
            context.sendCommittedId(detailRoute.paramMap.pipe(
                map(paramMap => paramMap.get('plan_id')!)
            ));
            return context;
        },
        deps: [ ActivatedRoute ]
    }
}