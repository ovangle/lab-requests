import { Component, inject } from "@angular/core";
import { SoftwareInfoComponent } from "../software-info.component";
import { SoftwareContext } from "../software-context";
import { AsyncPipe } from "@angular/common";
import { MatTabsModule } from "@angular/material/tabs";
import { RouterLink, RouterModule } from "@angular/router";


@Component({
    standalone: true,
    imports: [
        AsyncPipe,
        RouterModule,
        MatTabsModule,
        SoftwareInfoComponent
    ],
    host: {
        '[class.scaffold-content-full-width]': 'true'
    },
    template: `
    <h1>Software</h1>
    @if (software$ | async; as software) {
        <h2>{{software.name}}</h2>
        <software-info [software]="software"
                       display="detail-page-header">
        </software-info> 
    }

    <!--
    <nav mat-tab-nav-bar [tabPanel]="tabPanel">
        <a routerLink="./">Home</a>
        <a routerLink="./installations">Installations</a>
    </nav>
-->

    <mat-tab-nav-panel #tabPanel>
        <router-outlet />
    </mat-tab-nav-panel>
    `
})
export class SoftwareDetailPage {
    readonly softwareContext = inject(SoftwareContext);
    readonly software$ = this.softwareContext.committed$;
}