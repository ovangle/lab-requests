import { ChangeDetectorRef, DestroyRef, Injectable, inject } from "@angular/core";
import { BehaviorSubject, Observable, Subject, combineLatest, distinctUntilChanged, distinctUntilKeyChanged, map, scan, shareReplay, startWith } from "rxjs";


export interface EquipmentDetailState {
  readonly showTagChips: boolean;
  readonly updateLinkVisible: boolean;
  readonly updateLinkDisabled: boolean;

  readonly showDescription: boolean;
  readonly showDetail: boolean;
}

export type EquipmentDetailAction = (state: EquipmentDetailState) => EquipmentDetailState;

const initialState: EquipmentDetailState = {
  showTagChips: true,
  updateLinkVisible: true,
  updateLinkDisabled: false,
  showDescription: true,
  showDetail: true
};
const _stateKeys = [ ...Object.keys(initialState) ] as ReadonlyArray<keyof EquipmentDetailState>;

export function diffStates(
  a: EquipmentDetailState,
  b: EquipmentDetailState
): boolean {
  return _stateKeys.some(k => a[ k ] !== b[ k ]);
}

export interface EquipmentDetailSubpage {
  readonly subroute: 'update' | 'create-provision' | 'installation-detail';
}

export function setDetailPageSubroute(page: EquipmentDetailSubpage | null): EquipmentDetailAction {
  const route = page?.subroute || null;
  console.log('route', route);

  const showDetail = page === null;
  const updateLinkVisible = [ 'update', null ].includes(route);
  const updateLinkDisabled = page !== null;

  const showDescription = [ 'create-provision', 'installation-detail', null ].includes(route);
  const showTagChips = [ 'create-provision', 'installation-detail', null ].includes(route);

  return (state: EquipmentDetailState) => {
    return {
      ...state,
      showTagChips,
      updateLinkVisible,
      updateLinkDisabled,
      showDescription,
      showDetail
    }
  }
}


@Injectable()
export class EquipmentDetailStateService {
  readonly actionsSubject = new Subject<EquipmentDetailAction>();

  readonly state$ = this.actionsSubject.pipe(
    scan(
      (state, action) => action(state),
      initialState
    ),
    startWith(initialState),
    shareReplay(1)
  );

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
