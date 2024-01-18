import { DestroyRef, Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  ObservableInput,
  Subscription,
  distinctUntilKeyChanged,
  from,
  map,
  of,
} from 'rxjs';
import { SidenavMenuRoot } from './sidenav-menu/sidenav-menu';
import { ScaffoldLayoutComponent } from './scaffold-layout.component';

export interface ScaffoldState {
  readonly title: string;
  readonly isLoginButtonDisabled: boolean;
  readonly isSidenavDisabled: boolean;

  readonly isBodyScrollbarHidden: boolean;
}

@Injectable({ providedIn: 'root' })
export class ScaffoldStateService {
  readonly sidenavMenuRoot = inject(SidenavMenuRoot);

  readonly _stateSubject = new BehaviorSubject<ScaffoldState>({
    title: 'MyLab',
    isLoginButtonDisabled: false,
    isSidenavDisabled: false,
    isBodyScrollbarHidden: false
  });

  protected _patchState<K extends keyof ScaffoldState>(
    key: K,
    value: ScaffoldState[ K ],
  ) {
    const current = this._stateSubject.value;
    this._stateSubject.next({ ...current, [ key ]: value });
  }

  protected _getState<K extends keyof ScaffoldState>(
    key: K,
  ): Observable<ScaffoldState[ K ]> {
    return this._stateSubject.pipe(
      distinctUntilKeyChanged(key),
      map((state) => state[ key ]),
    );
  }

  get title$() {
    return this._getState('title');
  }
  setTitle(title: string | ObservableInput<string>) {
    if (typeof title === 'string') {
      title = of(title);
    }
    return from(title).subscribe((value) => this._patchState('title', value));
  }

  get isLoginButtonDisabled$() {
    return this._getState('isLoginButtonDisabled');
  }

  disableLoginButton(untilDestroyed: DestroyRef) {
    this._patchState('isLoginButtonDisabled', true);

    untilDestroyed.onDestroy(() => {
      this._patchState('isLoginButtonDisabled', false);
    });
  }

  get isSidenavDisabled$() {
    return this._getState('isSidenavDisabled');
  }
  toggleSidenav(disabled: boolean) {
    this._patchState('isSidenavDisabled', disabled);
  }

  get isBodyScrollbarHidden$() {
    return this._getState('isBodyScrollbarHidden');
  }
  toggleScrollbar(value: boolean) {
    this._patchState('isBodyScrollbarHidden', value);
  }


  connect(scaffoldLayout: ScaffoldLayoutComponent): Subscription {
    const sidenavDisabledSubscription = this.sidenavMenuRoot.isDisabled$.subscribe(
      isDisabled => this._patchState('isSidenavDisabled', isDisabled)
    );
    return new Subscription(() => {
      sidenavDisabledSubscription.unsubscribe();
    })
  }
}
