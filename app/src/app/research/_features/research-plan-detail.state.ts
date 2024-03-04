import { inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRouteSnapshot, ActivationEnd, Router } from "@angular/router";
import { Observable, filter, map, shareReplay, startWith } from "rxjs";


export interface ResearchPlanDetailConfig {
    showPlanSummary: boolean;
}

const defaultConfig: ResearchPlanDetailConfig = {
    showPlanSummary: true
};

export function configForSubroute(subroute: string | null): ResearchPlanDetailConfig {
    let config: ResearchPlanDetailConfig = {
        showPlanSummary: true
    };

    switch (subroute) {
        case 'update':
            return { ...config, showPlanSummary: false };
        case null:
            return config;
        default:
            throw new Error(`Expected a known detail subroute or null ${subroute}`)
    }
}

function isResearchPlanDetailSnapshot(s: ActivatedRouteSnapshot) {
    return s.parent?.url[ 0 ].path === 'research'
        && s.paramMap.has('plan_id');
}

export function injectResearchPlanDetailConfig(): Observable<ResearchPlanDetailConfig> {
    const router = inject(Router);

    return router.events.pipe(
        takeUntilDestroyed(),
        filter((e): e is ActivationEnd => e instanceof ActivationEnd),
        filter((e) => isResearchPlanDetailSnapshot(e.snapshot)),
        map((e) => {
            const subrouteUrl = e.snapshot.firstChild?.url || [];
            return configForSubroute(subrouteUrl[ 0 ]?.path || null)
        }),
        startWith(defaultConfig),
        shareReplay(1)
    );
}

