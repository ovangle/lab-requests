import { CommonModule } from "@angular/common";
import { Component, Input, inject } from "@angular/core";
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule } from "@angular/material/tree";
import { SidenavMenuGroup, SidenavMenuLink, SidenavMenuNode, SidenavMenuService } from "./sidenav-menu.service";
import { FlatTreeControl } from "@angular/cdk/tree";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";


interface FlattenedMenuNode {
    readonly title: string;
    readonly level: number;
    readonly expandable: boolean;
}

const _nodeTypeLevels: {[K in SidenavMenuNode['type']]: number} = {
    'group': 0,
    'link': 1
}
function _getFlattenedNodeLevel(node: SidenavMenuNode) {
    return _nodeTypeLevels[node.type];
}


/**
 * The context menu is global to all applications
 */
@Component({
    selector: 'scaffold-sidenav-menu',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatTreeModule 
    ],
    template: `
    <mat-tree [dataSource]="_dataSource" [treeControl]="_treeControl">
        <mat-tree-node *matTreeNodeDef="let node; when: isExpandable" matTreeNodePadding>
            <button mat-icon-button matTreeNodeToggle 
                    [attr.aria-label]="'Toggle ' + node.title">
                <mat-icon class="mat-icon-rtl-mirror">
                    {{ _treeControl.isExpanded(node) ? 'expand_more' : 'chevron_right' }}
                </mat-icon>
            </button>

            {{node.title}}
        </mat-tree-node>

        <mat-tree-node *matTreeNodeDef="let node" matTreeNodePadding>
            <button mat-icon-button disabled></button>
            {{node.title}}
        </mat-tree-node>
    </mat-tree>
    `
})
export class SidenavMenuComponent {
    readonly menuRoot = inject(SidenavMenuService);

    readonly _treeControl = new FlatTreeControl<FlattenedMenuNode>((node) => node.level, (node) => node.expandable);
    
    readonly _treeFlattener = new MatTreeFlattener<SidenavMenuNode, FlattenedMenuNode>( 
        (node: SidenavMenuNode, level: number) => {
            return {
                expandable: node.type === 'group',
                title: node.title,
                level
            };
        },
        (node: FlattenedMenuNode) => node.level,
        (node: FlattenedMenuNode) => node.expandable,
        (node: SidenavMenuNode) => [...node.children]
    );

    readonly _dataSource = new MatTreeFlatDataSource<SidenavMenuNode, FlattenedMenuNode>(
        this._treeControl, 
        this._treeFlattener
    );

    isExpandable = (node: FlattenedMenuNode) => node.expandable;
}