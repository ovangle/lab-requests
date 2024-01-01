import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { MatSidenavModule } from '@angular/material/sidenav';
import { SidenavMenuComponent } from './sidenav-menu/sidenav-menu.component';
import { ToolbarComponent } from './scaffold-toolbar.component';

@Component({
  selector: 'scaffold-layout',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,

    SidenavMenuComponent,
    ToolbarComponent,
  ],
  template: `
    <scaffold-toolbar />
    <mat-sidenav-container>
      <mat-sidenav mode="side" opened>
        <scaffold-sidenav-menu />
      </mat-sidenav>
      <mat-sidenav-content>
        <ng-content select=".content" />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    :host { 
        min-height: calc(100% - var(--mat-toolbar-standard-height)); 
        --scaffold-toolbar-height: 40px;
    }

    scaffold-toolbar {
        position: fixed;
        top: 0;
        width: 100%;
        z-index: 100;
    }
    
    mat-sidenav-container {
        position: absolute;
        top: var(--mat-toolbar-standard-height);
        bottom: 0;
        left: 0;
        right: 0;
    }

    mat-sidenav {
      width: 20em;
    }
    `,
})
export class ScaffoldLayoutComponent {}
