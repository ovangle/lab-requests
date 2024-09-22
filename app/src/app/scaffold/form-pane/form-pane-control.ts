import { Injectable, inject } from "@angular/core";
import { ActivatedRoute, ActivatedRouteSnapshot, ChildActivationEnd, NavigationEnd, Router, RouterEvent, UrlSegment } from "@angular/router";
import { BehaviorSubject, Observable, Subject, Subscription, buffer, combineLatest, endWith, filter, map, tap } from "rxjs";
import { ModelContext } from "src/app/common/model/context";

export interface ScaffoldFormPane {
  toggleIsOpen(formPath: UrlSegment[] | null): void
}

@Injectable({ providedIn: 'root' })
export class ScaffoldFormPaneControl {
  _router = inject(Router);
  readonly _isOpenSubject = new BehaviorSubject<boolean>(false);
  _context: ModelContext<any> | undefined;

  connect(formPane: ScaffoldFormPane): Subscription {
    const navigationEnd = this._router.events.pipe(filter(isNavigationEnd));

    return this._router.events.pipe(
      filter(isFormRouteActivationEnd),
      buffer(navigationEnd),
      map(activations => activations[0] || null),
      endWith(null),
      tap((activation: ChildActivationEnd | null) => {
        if (activation == null) {
          formPane.toggleIsOpen(null);
        } else {
          const formPath = formPathFromChildActivation(activation);
          console.log('formPath', formPath);
          formPane.toggleIsOpen(formPath);
        }
      }),
      map(activation => activation != null)
    ).subscribe((isOpen) => this._isOpenSubject.next(isOpen));
  }

  async open(context: ModelContext<any>, formPath: any[]): Promise<boolean> {
    this._context = context;
    return await this._router.navigate(['/', {
      outlets: {
        form: formPath
      }
    }]);
  }

  async close(): Promise<boolean> {
    if (this._context) {
      await this._context.refresh();
    }

    return this._router.navigate([{ outlets: { form: null } }]);
  }

  get isOpen(): boolean {
    return this._isOpenSubject.value;
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
    formPath = [...formPath, ...snapshot.url];
    snapshot = snapshot.firstChild;
  }
  return formPath;
}

function isNavigationEnd(e: unknown): e is NavigationEnd {
  return e instanceof NavigationEnd;
}