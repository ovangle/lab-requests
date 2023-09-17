import { Component } from "@angular/core";


@Component({
    selector: 'lab-dashboard-page',
    template: `
        <mat-nav-list>
            <a mat-list-item 
                routerLink="./equipments" >
                Equipments
            </a>
            <a mat-list-item 
                routerLink="./experimental-plans">
                Experimental plans
            </a>
        </mat-nav-list>
        <main>
            <router-outlet></router-outlet>
        </main>
    `,
    styleUrls: [
        './lab-dashboard.page.css'
    ]
})
export class LabDashboardPage{

}