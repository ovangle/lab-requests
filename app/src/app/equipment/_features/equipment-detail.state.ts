import { state } from "@angular/animations";
import { ChangeDetectorRef, DestroyRef, Injectable, inject } from "@angular/core";
import { BehaviorSubject, Observable, Subject, combineLatest, distinctUntilChanged, map, scan, shareReplay, startWith } from "rxjs";


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

export function reduceState(
  state: EquipmentDetailState,
  action: (state: EquipmentDetailState) => Partial<EquipmentDetailState>
): EquipmentDetailState {
  const result = action(state);
  return {
    ...state,
    ...result
  };
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

@Injectable()
export class EquipmentDetailStateService {
  readonly actionsSubject = new Subject<(state: EquipmentDetailState) => Partial<EquipmentDetailState>>();

  readonly state$ = this.actionsSubject.pipe(
    scan(
      (state, action) => ({ ...state, ...action(state) }),
      initialState
    ),
    shareReplay(1)
  )

  constructor() {
    const cdRef = inject(ChangeDetectorRef);
    const detectChangesSubscription = this.state$.subscribe(() => cdRef.detectChanges());

    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      this.actionsSubject.complete()
      detectChangesSubscription.unsubscribe();
    });

  }

  dispatch(action: EquipmentDetailAction) {
    this.actionsSubject.next(action);
  }

  select<T>(selector: (state: EquipmentDetailState) => T): Observable<T> {
    return this.state$.pipe(
      map(selector),
      distinctUntilChanged()
    )
  }

}
