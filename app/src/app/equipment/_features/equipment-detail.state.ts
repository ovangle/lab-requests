import { state } from "@angular/animations";
import { ChangeDetectorRef, DestroyRef, Injectable, inject } from "@angular/core";
import { BehaviorSubject, Observable, Subject, combineLatest, distinctUntilChanged, distinctUntilKeyChanged, map, scan, shareReplay, startWith } from "rxjs";


export interface EquipmentDetailState {
  readonly showTagChips: boolean;
  readonly updateLinkVisible: boolean;
  readonly updateLinkDisabled: boolean;

  readonly showDescription: boolean;
  readonly showDetail: boolean;
}

export type EquipmentDetailAction = (state: EquipmentDetailState) => Partial<EquipmentDetailState>;

const initialState: EquipmentDetailState = {
  showTagChips: true,
  updateLinkVisible: true,
  updateLinkDisabled: false,
  showDescription: true,
  showDetail: true
};
const _stateKeys = [ ...Object.keys(initialState) ] as ReadonlyArray<keyof EquipmentDetailState>;

export function reduceState(
  state: EquipmentDetailState,
  action: (state: EquipmentDetailState) => Partial<EquipmentDetailState>
): EquipmentDetailState {
  debugger;
  const result = action(state);
  return {
    ...state,
    ...result
  };
}

export function diffStates(
  a: EquipmentDetailState,
  b: EquipmentDetailState
): boolean {
  return _stateKeys.some(k => a[ k ] !== b[ k ]);
}

export function setNoSubroute(state: EquipmentDetailState): Partial<EquipmentDetailState> {
  return {
    showTagChips: true,
    updateLinkVisible: true,
    updateLinkDisabled: false,
    showDescription: true,
    showDetail: true
  };
}

export function setUpdateSubroute(state: EquipmentDetailState) {
  return {
    showTagChips: false,
    updateLinkDisabled: true,
    showDescription: false,
    showDetail: false
  }
}

export function setCreateProvisionSubroute(state: EquipmentDetailState): Partial<EquipmentDetailState> {
  return {
    showTagChips: true,
    updateLinkVisible: false,
    showDescription: true,
    showDetail: false
  };
}

export function setProvisionDetailSubroute(state: EquipmentDetailState): Partial<EquipmentDetailState> {
  return {
    showTagChips: true,
    updateLinkVisible: false,
    showDescription: true,
    showDetail: false
  }
}

@Injectable()
export class EquipmentDetailStateService {
  readonly actionsSubject = new Subject<(state: EquipmentDetailState) => Partial<EquipmentDetailState>>();

  readonly state$ = this.actionsSubject.pipe(
    scan(
      (state, action) => reduceState(state, action),
      initialState
    ),
    startWith(initialState),
    shareReplay(1)
  )

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      this.actionsSubject.complete();
    });

  }

  dispatch(action: EquipmentDetailAction) {
    window.setTimeout(() => {
      console.log('dispatching', action);
      this.actionsSubject.next(action)
    });
  }

  select<T>(selector: (state: EquipmentDetailState) => T): Observable<T> {
    return this.state$.pipe(
      map(selector),
      distinctUntilChanged()
    )
  }

}
