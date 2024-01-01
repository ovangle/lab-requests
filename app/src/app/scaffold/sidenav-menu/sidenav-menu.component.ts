import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
  MatTreeModule,
} from '@angular/material/tree';
import {
  SidenavMenuGroup,
  SidenavMenuLink,
  SidenavMenuNode,
  SidenavMenuRootControl,
  formatSidenavMenuGroup,
  sidenavMenuNodeChildren,
} from './sidenav-menu-group-control';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { ScaffoldStateService } from '../scaffold-state.service';
import { map } from 'rxjs';

interface FlattenedMenuNode {
  readonly title: string;
  readonly level: number;
  readonly expandable: boolean;
  readonly icon?: string;
  readonly link?: any[];
}

@Component({
  selector: 'scaffold-sidenav-menu-link',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: ` <a [routerLink]="node.routerLink">{{ node.title }}</a> `,
})
export class SidenavMenuLinkComponent {
  @Input({ required: true })
  node: SidenavMenuLink;
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

    SidenavMenuLinkComponent,
  ],
  template: `
    @if (!(scaffoldState.isSidenavDisabled$ | async)) {
    <mat-tree [dataSource]="_dataSource" [treeControl]="_treeControl">
      <mat-tree-node
        *matTreeNodeDef="let node; when: isExpandable"
        matTreeNodePadding
      >
        <button
          mat-icon-button
          matTreeNodeToggle
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

      <mat-tree-node *matTreeNodeDef="let node" matTreeNodePadding>
        <button mat-icon-button disabled></button>
        {{ node.title }}
      </mat-tree-node>
    </mat-tree>
    }
  `,
  styles: `
  :host { display: block; min-width: 20em; }
  `,
})
export class SidenavMenuComponent implements OnInit {
  readonly scaffoldState = inject(ScaffoldStateService);
  readonly menuRoot = inject(SidenavMenuRootControl);
  readonly _destroyRef = inject(DestroyRef);

  readonly _treeControl = new FlatTreeControl<FlattenedMenuNode>(
    (node) => node.level,
    (node) => node.expandable
  );

  readonly _treeFlattener = new MatTreeFlattener<
    SidenavMenuNode,
    FlattenedMenuNode
  >(
    (node: SidenavMenuNode, level: number) => ({
      expandable: node.type === 'group',
      title: node.title,
      level,
    }),
    (node: FlattenedMenuNode) => node.level,
    (node: FlattenedMenuNode) => node.expandable,
    (node: SidenavMenuNode) => sidenavMenuNodeChildren(node)
  );

  readonly _dataSource = new MatTreeFlatDataSource<
    SidenavMenuNode,
    FlattenedMenuNode
  >(this._treeControl, this._treeFlattener);

  isExpandable(_: number, node: FlattenedMenuNode) {
    return node.expandable;
  }

  ngOnInit() {
    const menuSubscription = this.menuRoot.value$.subscribe((root) => {
      console.log(formatSidenavMenuGroup(root));
      this._dataSource.data = sidenavMenuNodeChildren(root);
    });
    this.menuRoot.value$.connect();

    this._destroyRef.onDestroy(() => {
      menuSubscription.unsubscribe();
    });
  }
}
