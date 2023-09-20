import { Component } from "@angular/core";


@Component({
    selector: 'lab-dashboard-page',
    template: `
        <mat-nav-list>
            <a mat-list-item routerLink="./">
                <mat-icon matListItemIcon>home</mat-icon>
                <span matListItemTitle>Home</span>
            </a>
            <a mat-list-item 
                routerLink="./equipments" >
                <mat-icon matListItemIcon></mat-icon>
                <span matListItemTitlle>Equipments</span>
            </a>
            <a mat-list-item 
                routerLink="./experimental-plans">
                <mat-icon matListItemIcon></mat-icon>
                <span matListItemTitle>Experimental plans</span>
            </a>
        </mat-nav-list>
        <main>
            <router-outlet></router-outlet>
        </main>
    `,
    styles: [`
    :host {
        position: relative;
    }
    main {
        max-width: 60vw;
    }
    `],
    styleUrls: [
        './lab-dashboard.page.css'
    ]
})
export class LabDashboardPage{

}