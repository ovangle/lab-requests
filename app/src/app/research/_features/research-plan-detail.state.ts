import { inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, ActivatedRouteSnapshot, ActivationEnd, Router } from "@angular/router";
import { Observable, filter, map, shareReplay, startWith, tap } from "rxjs";


export interface ResearchPlanDetailConfig {
    showEditButton: boolean;
    editButtonDisabled: boolean;

    showPlanSummary: boolean;
    showGeneralInfo: boolean;
    showTasks: boolean;
    showRequirements: boolean;
}

const defaultConfig: ResearchPlanDetailConfig = {
    showEditButton: true,
    editButtonDisabled: false,
    showPlanSummary: true,
    showGeneralInfo: true,
    showTasks: true,
    showRequirements: true,
};

const updateFormConfig: ResearchPlanDetailConfig = {
    showEditButton: true,
    editButtonDisabled: true,
    showPlanSummary: false,
    showGeneralInfo: false,
    showTasks: false,
    showRequirements: false,
};

export function configForSubroute(subroute: string | null): ResearchPlanDetailConfig {
    console.log('detail page subroute', subroute);

    switch (subroute) {
        case 'update':
            return updateFormConfig;
        case null:
            return defaultConfig;
        default:
            throw new Error(`Expected a known detail subroute or null ${subroute}`)
    }
}

function isResearchPlanDetailSnapshot(s: ActivatedRouteSnapshot) {
    return s.parent?.url[ 0 ] !== undefined
        && s.parent.url[ 0 ].path === 'research'
        && s.paramMap.has('plan_id');
}

export function injectResearchPlanDetailConfig(): Observable<ResearchPlanDetailConfig> {
    const router = inject(Router);
    const activatedRoute = inject(ActivatedRoute);

    const initialSnapshot = activatedRoute.snapshot;

    return router.events.pipe(
        tap((e) => console.log(e)),
        takeUntilDestroyed(),
        filter((e): e is ActivationEnd => e instanceof ActivationEnd),
        tap((e) => console.log(e)),
        filter((e) => isResearchPlanDetailSnapshot(e.snapshot)),
        startWith({ snapshot: initialSnapshot }),
        map((e: { snapshot: ActivatedRouteSnapshot }) => {
            const subrouteUrl = e.snapshot.firstChild?.url || [];
            return configForSubroute(subrouteUrl[ 0 ]?.path || null)
        }),
        shareReplay(1)
    );
}

