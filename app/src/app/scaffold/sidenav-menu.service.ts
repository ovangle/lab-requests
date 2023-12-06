import { Inject, Injectable, InjectionToken, Provider, inject } from "@angular/core";
import { MatTreeFlatDataSource } from "@angular/material/tree";
import { BehaviorSubject, Subject } from "rxjs";
import { FlatTreeControl } from "@angular/cdk/tree";

export type NodeReplacerFn = (node: SidenavMenuNode) => SidenavMenuNode | SidenavMenuNode[];

interface _MenuNode {
    readonly type: SidenavMenuNodeType;
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
function replace<T extends SidenavMenuNode>(node: T, replacer: NodeReplacerFn): T {
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
        node = _spliceMenuNodeChildren(index, 1, ...replaceNodes);
    });
    return replacer(node);
}

export type MenuNodeParams = Omit<_MenuNode, 'type' | 'children' | 'pushChild' | 'spliceChildren' | 'replace'>;
   
export interface SidenavMenuLink extends _MenuNode {
    readonly type: 'link';

    readonly title: string;
    readonly commands: any[];
}

export type SidenavMenuLinkParams = MenuNodeParams & {
    readonly title: string;
    readonly commands: any[];
};

function sidenavMenuLink(params: SidenavMenuLinkParams) {
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
    readonly id: string;
    readonly title: string;
    readonly links: readonly SidenavMenuLinkParams[]
};
function sidenavMenuGroup(params: SidenavMenuGroupParams): SidenavMenuGroup {
    return {
        type: 'group', 
        children: params.links.map(linkParams => sidenavMenuLink(linkParams)),
        ...params
    }
}

export const SIDENAV_MENU_GROUP_PARAMS = new InjectionToken<SidenavMenuGroup[]>('SIDENAV_MENU_GROUP');

export function provideSidenavMenuGroup(group: SidenavMenuGroupParams): Provider {
    return {
        provide: SIDENAV_MENU_GROUP_PARAMS,
        multi: true,
        useValue: group
    }
}


@Injectable({providedIn: 'root'})
export class SidenavMenuService {
    readonly groups: {[k: string]: SidenavMenuGroup};

    constructor(
        @Inject(SIDENAV_MENU_GROUP_PARAMS)
        groupParams: SidenavMenuGroupParams[]
    ) {
        this.groups = Object.fromEntries(groupParams.map(params => {
            return [params.id, sidenavMenuGroup(params)] as [PropertyKey, SidenavMenuGroup]
        }));
    }
}

export type SidenavMenuNode = SidenavMenuLink | SidenavMenuGroup;