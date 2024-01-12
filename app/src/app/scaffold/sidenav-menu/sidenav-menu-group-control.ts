import {
  InjectionToken,
  Type,
  Provider,
  Injectable,
  Inject,
  inject,
} from '@angular/core';
import {
  BehaviorSubject,
  Connectable,
  Observable,
  ReplaySubject,
  Subscription,
  combineLatest,
  connectable,
  defer,
  map,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';

export class SidenavMenuLink {
  readonly type = 'link';
  constructor(
    readonly title: string,
    readonly routerLink: any[],
    readonly icon?: string,
  ) { }
}

export function formatSidenavMenuLink(
  link: SidenavMenuLink,
  level: number = 0,
): string {
  return `${'\t'.repeat(level)}[${link.title}](${link.routerLink})\n`;
}

export interface SidenavMenuGroupState {
  readonly title: string;
  readonly links: readonly SidenavMenuLink[];
}

export interface SidenavMenuGroup extends SidenavMenuGroupState {
  readonly type: 'group';
  readonly id: string;

  readonly subgroups: readonly SidenavMenuGroup[];
  readonly links: readonly SidenavMenuLink[];
}

export function formatSidenavMenuGroup(
  group: SidenavMenuGroup,
  level: number = 0,
): string {
  let str = `${'\t'.repeat(level)}${group.id}:\n`;
  for (const g of group.subgroups) {
    str += formatSidenavMenuGroup(g, level + 1);
  }
  for (const l of group.links) {
    str += formatSidenavMenuLink(l, level + 1);
  }
  return str;
}

export type SidenavMenuNode = SidenavMenuGroup | SidenavMenuLink;

export function sidenavMenuNodeChildren(node: SidenavMenuNode) {
  if (node.type === 'link') {
    return [];
  } else {
    return [ ...node.subgroups, ...node.links ];
  }
}

export class SidenavMenuGroupControl {
  get parent(): SidenavMenuGroupControl | null {
    if (this._parent === undefined) {
      throw new Error('Parent uninitialized');
    }
    return this._parent;
  }

  _setParent(parent: SidenavMenuGroupControl) {
    this._parent = parent;
  }
  _parent: SidenavMenuGroupControl | null = null;

  readonly id: string;
  readonly _stateSubject: BehaviorSubject<SidenavMenuGroupState>;

  protected _subgroupControls: { [ id: string ]: SidenavMenuGroupControl } = {};
  readonly _enabledSubgroupIdsSubject = new BehaviorSubject<string[]>([]);

  connectSubgroup(control: SidenavMenuGroupControl): Subscription {
    if (this._subgroupControls[ control.id ] !== undefined) {
      throw new Error(`Subgroup ${control.id} is already connected`);
    }
    this._subgroupControls[ control.id ] = control;

    const enabledSubgroupIds = this._enabledSubgroupIdsSubject.value;
    this._enabledSubgroupIdsSubject.next([ ...enabledSubgroupIds, control.id ]);

    control._setParent(this);
    return control.value$.connect();
  }

  readonly subgroups$: Observable<readonly SidenavMenuGroup[]> =
    this._enabledSubgroupIdsSubject.pipe(
      switchMap((enabledIds) => {
        const enabledGroupControls = enabledIds.map(
          (id) => this._subgroupControls[ id ],
        );
        return combineLatest(enabledGroupControls.map((c) => c.value$));
      }),
      startWith([]),
      shareReplay(1),
    );

  get links$() {
    return this._stateSubject.pipe(map((s) => s.links));
  }

  readonly value$: Connectable<SidenavMenuGroup> = connectable(
    defer(() =>
      combineLatest([ this._stateSubject, this.subgroups$ ]).pipe(
        map(
          ([ state, subgroups ]): SidenavMenuGroup => ({
            type: 'group',
            id: this.id,
            ...state,
            subgroups,
          }),
        ),
      ),
    ),
    {
      connector: () => new ReplaySubject(1),
    },
  );

  constructor(id: string, title: string) {
    this.id = id;
    const links: readonly SidenavMenuLink[] = [];
    this._stateSubject = new BehaviorSubject({ title, links });
  }

  protected setState<K extends keyof SidenavMenuGroupState>(
    key: K,
    value: SidenavMenuGroupState[ K ],
  ) {
    const state = this._stateSubject.value;
    this._stateSubject.next({
      ...state,
      [ key ]: value,
    });
  }

  pushLink(link: SidenavMenuLink) {
    const links = this._stateSubject.value.links;
    this.setState('links', [ ...links, link ]);
  }
  spliceLinks(index: number, deleteCount: number, ...items: SidenavMenuLink[]) {
    const links = [ ...this._stateSubject.value.links ];
    links.splice(index, deleteCount, ...items);
    this.setState('links', links);
  }

  getSubgroupControl(
    path: string | string[],
  ): SidenavMenuGroupControl | undefined {
    if (typeof path === 'string') {
      path = [ path ];
    } else if (path.length === 0) {
      return this;
    }
    const subgroupId = path.shift();
    const subgroupControl = this._subgroupControls[ subgroupId || '' ];
    return subgroupControl && subgroupControl.getSubgroupControl(path);
  }
}

export const SIDENAV_MENU_ROOT_GROUP_CONTROL =
  new InjectionToken<SidenavMenuGroupControl>('SIDENAV_MENU_GROUP_CONTROL');

export function provideSidenavMenuRootGroupControl(
  control:
    | Type<SidenavMenuGroupControl>
    | InjectionToken<SidenavMenuGroupControl>,
): Provider {
  return {
    provide: SIDENAV_MENU_ROOT_GROUP_CONTROL,
    multi: true,
    useExisting: control,
  };
}

@Injectable({ providedIn: 'root' })
export class SidenavMenuRootControl extends SidenavMenuGroupControl {
  constructor(
    @Inject(SIDENAV_MENU_ROOT_GROUP_CONTROL)
    rootControls: SidenavMenuGroupControl[],
  ) {
    super('$', '');
    this._parent = null;
    rootControls.forEach((c) => this.connectSubgroup(c));
  }
}
