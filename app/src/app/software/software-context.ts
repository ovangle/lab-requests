
import { filter, first, map, merge } from "rxjs";
import { Injectable, Provider, inject } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { ModelContext } from "../common/model/context";
import { Software, SoftwareService } from "./software";


@Injectable()
export class SoftwareContext extends ModelContext<Software> {
    override readonly service = inject(SoftwareService);
}

function _getSoftwareIndexFromRouteChildren(route: ActivatedRoute): ActivatedRoute | undefined {
    for (const child of route.children) {
        if (child.routeConfig?.path === 'software') {
            return child;
        }
        const indexFromChild = _getSoftwareIndexFromRouteChildren(child);
        if (indexFromChild !== undefined) {
            return indexFromChild;
        }
    }
    return undefined;
}

/**
 * Provides the software context for all routes
 * nested under /software/:software_id
 */
export function provideSoftwareDetailContext(): Provider {
    return {
        provide: SoftwareContext,
        useFactory: (route: ActivatedRoute) => {

            const softwareIndexRoute = _getSoftwareIndexFromRouteChildren(route);
            if (softwareIndexRoute === undefined) {
                throw new Error('Could not locate software index route');
            }

            function softwareIdFromIndexChild(child: ActivatedRoute) {
                return child.paramMap.pipe(
                    map(paramMap => paramMap.get('software_id')),
                )
            }

            const softwareId = merge(
                ...softwareIndexRoute.children.map(child => child.paramMap)
            ).pipe(
                map(paramMap => paramMap.get('software_id')),
                filter((id): id is string => id != null),
                first()
            );

            const context = new SoftwareContext();
            context.sendCommittedId(softwareId);
            return context;
        },
        deps: [ActivatedRoute]
    }
}