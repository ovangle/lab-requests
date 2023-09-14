import { Directive, ElementRef, Injectable, Renderer2, RendererFactory2, RendererStyleFlags2, inject } from "@angular/core";
import { ExperimentalPlanContext } from "./experimental-plan";
import { ActivatedRoute, Router, UrlSegment } from "@angular/router";
import { Resource, ResourceType } from "../work-unit/resources/common/resource";
import { BehaviorSubject, Observable, Subscription, defer, map, of, shareReplay, switchMap } from "rxjs";


@Injectable()
export class ExperimentalPlanFormPaneControlService {
    readonly _router = inject(Router);
    readonly _activatedRoute = inject(ActivatedRoute);

    readonly outletPath$: Observable<string | null> = this._activatedRoute.url.pipe(
        switchMap(() => {
            const formOutletChild = this._activatedRoute.children.find(child => child.outlet === 'form');
            return formOutletChild == null ? of(null) : formOutletChild.url;
        }),
        map(segments => {
            if (segments) {
                const urlTree = this._router.createUrlTree(segments);
                return this._router.serializeUrl(urlTree);
            }
            return null;
        }),
        shareReplay(1)
    );

    readonly isOpen$: Observable<boolean> = defer(() => this.outletPath$.pipe(
        map(urlSegments => urlSegments != null)
    ));

    open(formPath: string[]): Promise<boolean> {
        return this._router.navigate([{outlets: {form: formPath}}], {relativeTo: this._activatedRoute});
    }

    close(): Promise<boolean> {
        return this._router.navigate([{outlets: {form: null}}], {relativeTo: this._activatedRoute});
    }
}
