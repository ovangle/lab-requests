import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

import { MatSidenavModule } from '@angular/material/sidenav';
import { SidenavMenuComponent } from "./sidenav-menu.component";


@Component({
    selector: 'scaffold-main',
    standalone: true,
    imports: [
       CommonModule,

       MatSidenavModule,

       SidenavMenuComponent
    ],
    template: `
    <mat-sidenav-container>
        <mat-sidenav mode="side" opened>
            <scaffold-sidenav-menu />
        </mat-sidenav>
        <mat-sidenav-content>
            <ng-content select=".content"></ng-content>
        <mat-sidenav-content>
    </mat-sidenav-container>
    `
})
export class LayoutComponent {

}