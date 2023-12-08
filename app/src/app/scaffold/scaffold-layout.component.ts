import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

import { MatSidenavModule } from '@angular/material/sidenav';
import { SidenavMenuComponent } from "./sidenav-menu.component";
import { ToolbarComponent } from "./scaffold-toolbar.component";


@Component({
    selector: 'scaffold-layout',
    standalone: true,
    imports: [
       CommonModule,
       MatSidenavModule,

       SidenavMenuComponent,
       ToolbarComponent
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
        min-height: calc(100% - var(--scaffold-toolbar-height)); 
        --scaffold-toolbar-height: 40px;
    }

    scaffold-toolbar {
        position: fixed;
        top: 0;
        height: var(--scaffold-toolbar-height);
        width: 100%;
        z-index: 100;
    }
    
    mat-sidenav-container {
        margin-top: var(--scaffold-toolbar-height);
        height: calc(100% - var(--scaffold-toolbar-height));
        overflow-y: auto;
    }

    :host ::ng-deep .content {
        height: 100%;
    }
    `
})
export class ScaffoldLayoutComponent {

}