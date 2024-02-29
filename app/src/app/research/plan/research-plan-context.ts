import { Injectable, Provider, inject } from "@angular/core";
import { ModelContext } from "src/app/common/model/context";
import { ResearchPlan, ResearchPlanService } from "./research-plan";
import { ActivatedRoute } from "@angular/router";
import { roundToNearestMinutes } from "date-fns";
import { map } from "rxjs";

export function provideResearchPlanDetailContext(): Provider {
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


@Injectable()
export class ResearchPlanContext extends ModelContext<ResearchPlan> {
    override readonly service = inject(ResearchPlanService);

}