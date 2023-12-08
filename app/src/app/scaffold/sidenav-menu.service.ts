import { Inject, Injectable, InjectionToken, Provider, inject } from "@angular/core";
import { MatTreeFlatDataSource } from "@angular/material/tree";
import { BehaviorSubject, NEVER, Observable, ReplaySubject, Subject, Subscription, combineLatest, filter, isObservable, map, merge, mergeAll, mergeMap, of, scan, shareReplay, startWith, switchMap } from "rxjs";
import { FlatTreeControl } from "@angular/cdk/tree";
import { CollectionViewer } from "@angular/cdk/collections";
import { group } from "@angular/animations";
import { D } from "@angular/cdk/keycodes";

export type NodeReplacerFn = (node: SidenavMenuNode) => SidenavMenuNode | SidenavMenuNode[];

interface _MenuNode {
    readonly type: 'group' | 'link';
    readonly children: ReadonlyArray<SidenavMenuNode>;
}

function _setMenuNodeChildren<T extends SidenavMenuNode>(node: T, children: SidenavMenuNode[]): T {
    return {...node, children};
}

function _spliceMenuNodeChildren<T extends SidenavMenuNode>(node: T, index: number, deleteCount: number, ...items: SidenavMenuNode[]): T {
    const children = [...node.children];
    children.splice(index, deleteCount, ...items);
    return _setMenuNodeChildren(node, children);
}
/**
 * Walks the children in a right-to-left leaf-first traversal of the tree
 * 
 * The replacer is assumed to act immutably  
 * @param node 
 * @param replacer 
 * @returns 
 */
function replace(node: SidenavMenuNode, replacer: NodeReplacerFn): SidenavMenuNode | SidenavMenuNode[] {
    const toReplace: [number, ...SidenavMenuNode[]][] = [];

    node.children.forEach((child, index) => {
        const updated = replacer(child);
        if (Array.isArray(updated)) {
            // Always replace if we return an array
            toReplace.push([index, ...updated])
        } else if (updated !== child) {
            // Assume that the replacer acts immutably. If it doesn't return a different reference
            // then it doesn't get updated.
            toReplace.push([index, updated]);
        }
    })
    toReplace.forEach(([index, ...replaceNodes]) => {
        node = _spliceMenuNodeChildren(node, index, 1, ...replaceNodes);
    });
    return replacer(node);
}

export type MenuNodeParams = Omit<_MenuNode, 'type' | 'children'>;
   
export interface SidenavMenuLink extends _MenuNode {
    readonly type: 'link';

    readonly title: string;
    readonly commands: any[];
}

export type SidenavMenuLinkParams = MenuNodeParams & {
    readonly title: string;
    readonly commands: any[];
};

function sidenavMenuLink(params: SidenavMenuLinkParams): SidenavMenuLink {
    return {
        type: 'link',
        children: [],
        ...params
    };
}


export interface SidenavMenuGroup extends _MenuNode {
    readonly type: 'group';

    readonly id: string,
    readonly title: string,
}

export type SidenavMenuGroupParams = MenuNodeParams & { 
    id: string;
    title: string; 
    subgroups?: SidenavMenuGroupParams[] | Observable<SidenavMenuGroupParams[]>;
    links?: SidenavMenuLinkParams[] | Observable<SidenavMenuLinkParams[]>;
};

/**
 * Given a list of groups and a group to insert 
 * @param groups 
 * @param group 
 * @param atIndex 
 */
function mergeGroup(groups: SidenavMenuGroup[], group: SidenavMenuGroup, atIndex: number) {
    const isReplacement = groups[atIndex].id === group.id;
    groups.splice(atIndex, isReplacement ? 1 : 0, group);
    return groups;
}

function sidenavMenuGroup(params: SidenavMenuGroupParams): Observable<SidenavMenuGroup> {
    let subgroupParams$: Observable<SidenavMenuGroupParams[]>;
    if (Array.isArray(params.subgroups) || params.subgroups === undefined) {
        subgroupParams$ = of(params.subgroups || []);
    } else if (isObservable(params.subgroups)) {
        subgroupParams$ = params.subgroups;
    } else {
        throw new Error('subgroups, if provided, must be an array (or an observable of arrays) of subgroup params')
    }
    const subgroups$ = subgroupParams$.pipe(
        switchMap((subgroupParams: SidenavMenuGroupParams[]) => {
            const groupIds = subgroupParams.map(params => params.id);
            const getGroupIndex = (groupId: string) => groupIds.indexOf(groupId);

            const group$s = subgroupParams.map(params => sidenavMenuGroup(params));
            return merge(...group$s).pipe(
                scan(
                    (groups: SidenavMenuGroup[], group: SidenavMenuGroup) => {
                        return mergeGroup(groups, group, getGroupIndex(group.id));
                    },
                    [] as SidenavMenuGroup[]
                )
            );
        })
    )

    let linkParams$: Observable<SidenavMenuLinkParams[]>;
    if (Array.isArray(params.links) || params.links === undefined) {
        linkParams$ = of(params.links || []);
    } else if (isObservable(params.links)) {
        linkParams$ = params.links;
    } else {
        throw new Error('links, if provided, must be an array (or observable of arrays) of SidenavMenuLinkParams')

    }
    const links$ = linkParams$.pipe(
        map(linkParams => linkParams.map(sidenavMenuLink)),
        startWith([])
    );
    
    return combineLatest([subgroups$, links$]).pipe(
        map(([subgroups, links]) => ({
            type: 'group', 
            ...params,
            children: [...subgroups, ...links]
        }))
    );
}

export const SIDENAV_MENU_GROUP_PARAMS = new InjectionToken<SidenavMenuGroup[]>('SIDENAV_MENU_GROUP');

export function provideSidenavMenuGroup(group: SidenavMenuGroupParams): Provider {
    return {
        provide: SIDENAV_MENU_GROUP_PARAMS,
        multi: true,
        useValue: group
    }
}


export class SidenavMenuGroupControl {

    readonly groupId: string;
    readonly groupTitle: string;

    constructor(
        groupId: string,
        groupTitle: string,
    ) {
        this.groupId = groupId;
        this.groupTitle = groupTitle;
    }

    readonly _subgroupsSubject = new BehaviorSubject<{[k: string]: Observable<SidenavMenuGroup>}>({});
    readonly visibleGroupIdsSubject = new BehaviorSubject<string[]>([]);

    readonly _linksSubject = new BehaviorSubject<SidenavMenuLink[]>([]);

    getSubgroup(id: string): Observable<SidenavMenuGroup> {
        return this._subgroupsSubject.pipe(
            switchMap(groups => {
                if (groups[id] === undefined) {
                    throw new Error(`No group with id '${id}'`);
                }
                return groups[id];
            })
        );
    }

    registerSubgroup(paramsOrControl: SidenavMenuGroupParams | SidenavMenuGroupControl): Subscription {
        const allGroups = this._subgroupsSubject.value;
        let id, group$;
        if (paramsOrControl instanceof SidenavMenuGroupControl) {
            id = paramsOrControl.groupId;
            group$ = paramsOrControl.group$;
        } else {
            id = paramsOrControl.id;
            group$ = sidenavMenuGroup(paramsOrControl);
        }
        
        if (allGroups[id] !== undefined) {
            throw new Error(`Already added group with id '${id}'`);
        }

        allGroups[id] = group$.pipe(shareReplay(1));
        return allGroups[id].subscribe();
    }

    setVisibleSubgroups(groupIds: string[]) {
        this.visibleGroupIdsSubject.next(groupIds);
    }

    readonly subgroups$: Observable<SidenavMenuGroup[]> = this.visibleGroupIdsSubject.pipe(
        switchMap(visibleGroupIds => {
            const group$s = visibleGroupIds.map(groupId => this.getSubgroup(groupId)); 
            return merge(...group$s).pipe(
                scan(
                    (groups: SidenavMenuGroup[], group: SidenavMenuGroup) => {
                        return mergeGroup(groups, group, visibleGroupIds.indexOf(group.id));
                    },
                    [] as SidenavMenuGroup[]
                )
            )
        })
    );

    readonly group$: Observable<SidenavMenuGroup> = combineLatest([
        this.subgroups$,
        this._linksSubject,
    ]).pipe( 
        map(([subgroups, links]) => [...subgroups, ...links]),
        map(children => ({
            type: 'group',
            id: this.groupId,
            title: this.groupTitle,
            children
        }))
    );

    pushLink(...items: SidenavMenuLinkParams[]) {
        const links = items.map(item => sidenavMenuLink(item));
        this._linksSubject.next([...this._linksSubject.value, ...links]);
    }

    spliceLinks(atIndex: number, deleteCount: number, ...params: SidenavMenuLinkParams[]): SidenavMenuLink[] {
        const links = [...this._linksSubject.value];
        const removedLinks = links.splice(atIndex, deleteCount, ...params.map(params => sidenavMenuLink(params)));
        this._linksSubject.next(links);
        return removedLinks;
    }
}

@Injectable({providedIn: 'root'})
export class SidenavMenuRoot extends SidenavMenuGroupControl {
    constructor() {
        super('root', '<root>');
    }

}

export type SidenavMenuNode = SidenavMenuLink | SidenavMenuGroup;