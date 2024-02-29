import { Injectable, inject } from "@angular/core";
import { ActivatedRoute, ActivatedRouteSnapshot, ChildActivationEnd, NavigationEnd, Router, RouterEvent, UrlSegment } from "@angular/router";
import { BehaviorSubject, Observable, Subject, Subscription, buffer, combineLatest, endWith, filter, map } from "rxjs";

export interface ScaffoldFormPane {
  toggleIsOpen(formPath: UrlSegment[] | null): void
}

@Injectable({ providedIn: 'root' })
export class ScaffoldFormPaneControl {
  _router = inject(Router);

  connect(formPane: ScaffoldFormPane): Subscription {
    const navigationEnd = this._router.events.pipe(filter(isNavigationEnd));

    const isOpen = this._router.events.pipe(
      filter(isFormRouteActivationEnd),
      buffer(navigationEnd),
      map(activations => activations[ 0 ] || null),
      endWith(null),
    ).subscribe((activation: ChildActivationEnd | null) => {
      if (activation == null) {
        formPane.toggleIsOpen(null);
      } else {
        const formPath = formPathFromChildActivation(activation);
        console.log('formPath', formPath);
        formPane.toggleIsOpen(formPath);
      }
    });

    return new Subscription(() => {
      isOpen.unsubscribe();
    });
  }

  async open(formPath: any[]): Promise<boolean> {
    return await this._router.navigate([ '/', { outlets: { form: formPath } } ]);
  }

  async close(): Promise<boolean> {
    return this._router.navigate([ { outlets: { form: null } } ]);
  }
}

function isFormRouteActivationEnd(e: unknown): e is ChildActivationEnd {
  return e instanceof ChildActivationEnd
    && e.snapshot.outlet === 'form';
}

function formPathFromChildActivation(childActivation: ChildActivationEnd): UrlSegment[] {
  let snapshot: ActivatedRouteSnapshot | null = childActivation.snapshot;
  let formPath: any[] = [];
  while (snapshot) {
    formPath = [ ...formPath, ...snapshot.url ];
    snapshot = snapshot.firstChild;
  }
  return formPath;
}

function isNavigationEnd(e: unknown): e is NavigationEnd {
  return e instanceof NavigationEnd;
}