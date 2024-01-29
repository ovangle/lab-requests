import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
  MatTreeModule,
} from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { SidenavMenuRoot } from './sidenav-menu';
import { SidenavMenuNode, isFixedGroup } from './model';

interface FlattenedMenuNode {
  readonly title: string;
  readonly level: number;
  readonly isFixed: boolean;
  readonly expandable: boolean;
  readonly icon?: string;
  readonly link?: any[];
}


/**
 * The context menu is global to all applications
 */
@Component({
  selector: 'scaffold-sidenav-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    MatButtonModule,
    MatIconModule,
    MatTreeModule,
  ],
  template: `
      <mat-tree [dataSource]="_dataSource" [treeControl]="_treeControl">
        <mat-tree-node
          *matTreeNodeDef="let node; when: isExpandableGroup"
          matTreeNodePadding
        >
          <button
            mat-icon-button
            matTreeNodeToggle matTreeNodeToggleRecursive
            [attr.aria-label]="'Toggle ' + node.title"
          >
            <mat-icon class="mat-icon-rtl-mirror">
              {{
                _treeControl.isExpanded(node) ? 'expand_more' : 'chevron_right'
              }}
            </mat-icon>
          </button>

          {{ node.title }}
        </mat-tree-node>

        <mat-tree-node
              *matTreeNodeDef="let node; when: isStaticGroup"
              matTreeNodePadding matTreeNodePaddingIndent="48"
        >
          <a [routerLink]="node.routerLink">{{node.title}}</a>
        </mat-tree-node>

        <mat-tree-node *matTreeNodeDef="let node" 
            matTreeNodePadding matTreeNodePaddingIndent="24">
          <button mat-icon-button disabled>
            <mat-icon>{{node?.icon}}</mat-icon>
          </button>
          <a [routerLink]="node.routerLink">{{ node.title }}</a>
        </mat-tree-node>
      </mat-tree>
  `,
  styles: `
  :host { display: block; min-width: 20em; }
  `,
})
export class SidenavMenuComponent implements OnInit {
  readonly menuRoot = inject(SidenavMenuRoot);
  readonly _destroyRef = inject(DestroyRef);

  readonly _treeControl = new FlatTreeControl<FlattenedMenuNode>(
    (node) => node.level,
    (node) => node.expandable,
  );

  readonly _treeFlattener = new MatTreeFlattener<
    SidenavMenuNode,
    FlattenedMenuNode
  >(
    (node: SidenavMenuNode, level: number) => ({
      expandable: node.type === 'group',
      isFixed: node.type === 'group' && isFixedGroup(node),
      ...node,
      level,
    }),
    (node: FlattenedMenuNode) => node.level,
    (node: FlattenedMenuNode) => node.expandable,
    (node: SidenavMenuNode) => node.type === 'group' ? node.children : [],
  );

  readonly _dataSource = new MatTreeFlatDataSource<
    SidenavMenuNode,
    FlattenedMenuNode
  >(this._treeControl, this._treeFlattener);

  isExpandableGroup(_: number, node: FlattenedMenuNode) {
    console.log('is expandable group', node, node.expandable && !node.isFixed)
    return node.expandable && !node.isFixed;
  }

  isStaticGroup(_: number, node: FlattenedMenuNode) {
    console.log('is fixed group', node, node.expandable && node.isFixed);
    return node.expandable && node.isFixed;
  }

  setNodes(nodes: SidenavMenuNode[]) {
    this._dataSource.data = nodes;
  }

  ngOnInit() {
    const menuConnection = this.menuRoot.connect(this);
    this._destroyRef.onDestroy(() => {
      menuConnection.unsubscribe();
    })
  }
}
