import { CommonModule } from "@angular/common";
import { Call } from "@angular/compiler";
import { Component, Injectable, InjectionToken, inject } from "@angular/core";
import { MatListModule } from "@angular/material/list";
import { BehaviorSubject } from "rxjs";

export type SidenavMenuNodeType = 'group' | 'link';

export interface SidenavMenuNodeBase {
    readonly type: SidenavMenuNodeType;
    readonly title: string;

    readonly children: ReadonlyArray<SidenavMenuNode>;
}

export interface SidenavMenuGroup extends SidenavMenuNodeBase {
    readonly type: 'group';
    readonly name: string;

    readonly isExpanded: boolean;
}

export function sidenavMenuGroup(name: string, title: string, children: SidenavMenuNode[]): SidenavMenuGroup {
    return {
        type: 'group',
        name,
        title,
        children,
        isExpanded: false
    };
}

function expandGroup(group: SidenavMenuGroup): SidenavMenuGroup {
    return {...group, isExpanded: true}
}
function collapseGroup(group: SidenavMenuGroup): SidenavMenuGroup {
    return {...group, isExpanded: false};
}

export interface SidenavMenuLink extends SidenavMenuNodeBase {
    readonly type: 'link';
    readonly routerLink: any[];
}

export function menuLink(title: string, routerLink: any[]): SidenavMenuLink {
    return {
        type: 'link',
        title,
        routerLink,
        children: []
    }
}

export type SidenavMenuNode = SidenavMenuGroup | SidenavMenuLink;

function setChildren(node: SidenavMenuNode, children: SidenavMenuNode[]) {
    if (node.children.length !== children.length
        || node.children.some((child, i) => child !== children[i])
    ) {
        return {...node, children};
    }
    return node;
}

export const APP_SIDENAV_MENU = new InjectionToken<SidenavMenuGroup>('APP_SIDENAV_MENU');

@Injectable({providedIn: 'root'})
export class SidenavMenuController {
    protected _menu: SidenavMenuComponent | undefined = undefined;
    get menu(): SidenavMenuComponent {
        return this._menu!;
    }

    readonly _initialTree = inject(APP_SIDENAV_MENU);
    readonly treeSubject = new BehaviorSubject<SidenavMenuGroup>(this._initialTree);
    readonly tree$ = this.treeSubject.asObservable()
    get tree() {
        return this.treeSubject.value;
    }
    
    attach(menu: SidenavMenuComponent) {
        if (this._menu !== undefined) {
            throw new Error('Sidenav menu already attached');
        }
        this._menu = menu;
    }

    protected walk(
        replaceNode: (node: SidenavMenuNode) => SidenavMenuNode, 
        current: SidenavMenuNode | undefined = undefined
    ) {
        current  = current || this.tree; 

        const children = current.children.map(child => this.walk(replaceNode, child));
        current = setChildren(current, children);
        return replaceNode(current);
    }

    expand(groupName: string): void {
        this.walk((node) => {
            if (node.type === 'group' && node.name === groupName) {
                return expandGroup(node);
            }
            return node;
        })
    }

    collapse(groupName: string): void {
        this.walk((node) => {
            if (node.type === 'group' && node.name === groupName) {
                return collapseGroup(node);
            }
            return node;
        });
        
    }
}

/**
 * The context menu is global to all applications
 */
@Component({
    selector: 'scaffold-sidenav-menu',
    standalone: true,
    imports: [
        CommonModule,
        MatListModule
    ],
    template: `
    <nav mat-nav-list>
        
    </nav>
    `
})
export class SidenavMenuComponent {

}