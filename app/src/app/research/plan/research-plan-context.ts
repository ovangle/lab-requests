import { Injectable, Provider, inject } from "@angular/core";
import { ModelContext } from "src/app/common/model/context";
import { ResearchPlan, ResearchPlanService, UpdateResearchPlan } from "./research-plan";
import { ActivatedRoute } from "@angular/router";
import { roundToNearestMinutes } from "date-fns";
import { Observable, first, firstValueFrom, map, switchMap, tap } from "rxjs";
import { LabResourceConsumerDelegateContext, LabResourceConsumerPatch } from "src/app/lab/lab-resource-consumer/resource-container";
import { Resource, ResourcePatch } from "src/app/lab/lab-resource/resource";
import { ResourceType } from "src/app/lab/lab-resource/resource-type";



@Injectable()
export class ResearchPlanContext extends ModelContext<ResearchPlan> implements LabResourceConsumerDelegateContext<ResearchPlan> {
    override readonly service = inject(ResearchPlanService);

    applyResourceConsumerPatch(patch: LabResourceConsumerPatch): Observable<ResearchPlan> {
        return this.committed$.pipe(
            first(),
            map(plan => [
                plan,
                {
                    title: plan.title,
                    description: plan.description,
                    funding: plan.funding,
                    ...patch
                }
            ] as [ ResearchPlan, UpdateResearchPlan ]),
            switchMap(([ plan, request ]) => this.service.update(plan, request))
        );
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