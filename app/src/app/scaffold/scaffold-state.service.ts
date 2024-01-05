import { DestroyRef, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  ObservableInput,
  distinctUntilKeyChanged,
  from,
  map,
  of,
} from 'rxjs';

export interface ScaffoldState {
  readonly title: string;
  readonly isLoginButtonDisabled: boolean;
  readonly isSidenavDisabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class ScaffoldStateService {
  readonly _stateSubject = new BehaviorSubject<ScaffoldState>({
    title: 'MyLab',
    isLoginButtonDisabled: false,
    isSidenavDisabled: false,
  });

  protected _patchState<K extends keyof ScaffoldState>(
    key: K,
    value: ScaffoldState[K],
  ) {
    const current = this._stateSubject.value;
    this._stateSubject.next({ ...current, [key]: value });
  }

  protected _getState<K extends keyof ScaffoldState>(
    key: K,
  ): Observable<ScaffoldState[K]> {
    return this._stateSubject.pipe(
      distinctUntilKeyChanged(key),
      map((state) => state[key]),
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
  disableSidenav(untilDestroyed: DestroyRef) {
    this._patchState('isSidenavDisabled', true);
    untilDestroyed.onDestroy(() => {
      this._patchState('isSidenavDisabled', false);
    });
  }
}
