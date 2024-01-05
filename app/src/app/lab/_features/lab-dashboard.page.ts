import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'lab-dashboard-page',
  template: `
    <mat-nav-list
      [ngClass]="{ expanded: isNavExpanded, collapsed: !isNavExpanded }"
    >
      <a mat-list-item routerLink="./">
        <mat-icon matListItemIcon>home</mat-icon>
        @if (isNavExpanded) {
          <span matListItemTitle>Home</span>
        }
      </a>
      <a mat-list-item routerLink="./equipments">
        <mat-icon matListItemIcon></mat-icon>

        @if (isNavExpanded) {
          <span matListItemTitle> Equipment</span>
        }
      </a>
      <a mat-list-item routerLink="./experimental-plans">
        <mat-icon matListItemIcon></mat-icon>

        @if (isNavExpanded) {
          <span matListItemTitle>Experimental plans</span>
        }
      </a>
    </mat-nav-list>
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  animations: [],
  styleUrls: ['./lab-dashboard.page.css'],
})
export class LabDashboardPage {
  readonly navExpansionState = new BehaviorSubject<'expanded' | 'collapsed'>(
    'collapsed',
  );

  get isNavExpanded() {
    return this.navExpansionState.value === 'expanded';
  }
}
