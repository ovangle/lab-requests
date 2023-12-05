import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

import { MatSidenavModule } from '@angular/material/sidenav';
import { SidenavMenuComponent } from "./sidenav-menu.component";


@Component({
    selector: 'scaffold-layout',
    standalone: true,
    imports: [
       CommonModule,

       MatSidenavModule,

       SidenavMenuComponent
    ],
    template: `
    <mat-sidenav-container>
        <mat-sidenav>
            <scaffold-sidenav-menu></scaffold-sidenav-menu>
        </mat-sidenav>
    </mat-sidenav-container>
    `
})
export class LayoutComponent {

}