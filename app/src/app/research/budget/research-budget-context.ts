import { inject, Injectable } from "@angular/core";
import { ModelContext, provideModelContextFromRoute } from "src/app/common/model/context";
import { ResearchBudget, ResearchBudgetService } from "./research-budget";
import { P } from "@angular/cdk/keycodes";
import { firstValueFrom, Observable, switchMap } from "rxjs";
import { Lab, LabService } from "src/app/lab/lab";


@Injectable()
export class ResearchBudgetContext extends ModelContext<ResearchBudget, ResearchBudgetService> {
    readonly labService = inject(LabService);

    /**
     *
     * @param lab$
     */
    async defaultToLabBudget(lab$: Observable<Lab | string>) {
        const currentBudget = await firstValueFrom(this.committed$);
        if (currentBudget == null) {
            const lab = await firstValueFrom(lab$);
            const labBudget = await firstValueFrom(this.service.fetchLabBudget(lab));
            this.nextCommitted(labBudget);
        }
    }

}

export function provideResearchBudgetContext(
    options: { isOptionalParam: boolean } = { isOptionalParam: true }
) {
    return provideModelContextFromRoute(
        ResearchBudgetService,
        ResearchBudgetContext,
        'budget',
        options.isOptionalParam
    );
}