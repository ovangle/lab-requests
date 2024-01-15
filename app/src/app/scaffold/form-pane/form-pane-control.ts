import { Injectable, inject } from "@angular/core";
import { ActivatedRoute, ChildActivationEnd, NavigationEnd, Router, RouterEvent } from "@angular/router";
import { BehaviorSubject, Subscription, buffer, combineLatest, endWith, filter, map } from "rxjs";

export interface ScaffoldFormPane {
  toggleIsOpen(isOpen: boolean, context: any): void
}

@Injectable({ providedIn: 'root' })
export class ScaffoldFormPaneControl {
  _router = inject(Router);

  contextSubject = new BehaviorSubject<any>(null);

  connect(formPane: ScaffoldFormPane): Subscription {
    const navigationEnd = this._router.events.pipe(filter(isNavigationEnd));

    const isOpen = this._router.events.pipe(
      filter(isFormRouteActivationEnd),
      buffer(navigationEnd),
      map(activations => activations.length > 0),
      endWith(false)
    );

    const syncIsOpen = combineLatest([
      isOpen,
      this.contextSubject
    ]).subscribe(
      ([isOpen, context]) => formPane.toggleIsOpen(isOpen, context)
    );

    return new Subscription(() => {
      syncIsOpen.unsubscribe();
    });
  }

  open(formPath: any[], context: any): Promise<boolean> {
    this.contextSubject.next(context);
    return this._router.navigate([{ outlets: { form: formPath } }]);
  }

  async close(): Promise<boolean> {
    const isFulfilled = this._router.navigate([{ outlets: { form: null } }]);
    this.contextSubject.next(null);
    return isFulfilled;
  }
}

function isFormRouteActivationEnd(e: unknown): e is ChildActivationEnd {
  return e instanceof ChildActivationEnd
    && e.snapshot.outlet === 'form';
}

function isNavigationEnd(e: unknown): e is NavigationEnd {
  return e instanceof NavigationEnd;
}