import { Injectable, Provider, inject } from "@angular/core";
import { ModelContext, provideModelContextFromRoute } from "src/app/common/model/context";
import { ResearchPlan, ResearchPlanService, UpdateResearchPlan } from "./research-plan";
import { ActivatedRoute } from "@angular/router";
import { roundToNearestMinutes } from "date-fns";
import { Observable, first, firstValueFrom, map, switchMap, tap } from "rxjs";



@Injectable()
export class ResearchPlanContext extends ModelContext<ResearchPlan, ResearchPlanService> {
}

export function provideResearchPlanContextFromRouteParam(isOptionalParam: boolean) {
    return provideModelContextFromRoute(
        ResearchPlanService,
        ResearchPlanContext,
        'research_plan',
        isOptionalParam
    );
}
