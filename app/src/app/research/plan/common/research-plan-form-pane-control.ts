import { Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  ChildActivationEnd,
  NavigationEnd,
  Router,
} from '@angular/router';
import {
  Observable,
  buffer,
  defer,
  endWith,
  filter,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';
import { BodyScrollbarHidingService } from 'src/app/utils/body-scrollbar-hiding.service';

@Injectable()
export class ResearchPlanFormPaneControl {
  _router = inject(Router);
  _activatedRoute = inject(ActivatedRoute);
  _appScaffold = inject(BodyScrollbarHidingService);

  readonly _navigationEnd$ = this._router.events.pipe(
    takeUntilDestroyed(),
    filter((evt) => evt instanceof NavigationEnd),
  );

  readonly isOpen$ = this._router.events.pipe(
    takeUntilDestroyed(),
    filter(
      (e): e is ChildActivationEnd =>
        e instanceof ChildActivationEnd && e.snapshot.outlet === 'form',
    ),
    buffer(this._navigationEnd$),
    map((activations) => activations.length > 0),
    endWith(false),
  );

  constructor() {
    this.isOpen$.subscribe((isOpen) => {
      console.log('is open', isOpen);
      this._appScaffold.toggleScrollbar(!isOpen);
    });
  }

  open(formPath: any[]): Promise<boolean> {
    return this._router.navigate([{ outlets: { form: formPath } }], {
      relativeTo: this._activatedRoute,
    });
  }

  close(): Promise<boolean> {
    return this._router.navigate([{ outlets: { form: null } }], {
      relativeTo: this._activatedRoute,
    });
  }
}
