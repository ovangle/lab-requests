import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, inject } from '@angular/core';

import { MatSidenavModule } from '@angular/material/sidenav';
import { SidenavMenuComponent } from './sidenav-menu/sidenav-menu.component';
import { ToolbarComponent } from './scaffold-toolbar.component';
import { ScaffoldStateService } from './scaffold-state.service';
import { ScaffoldFormPaneComponent } from './form-pane/form-pane.component';
import { map } from 'rxjs';

@Component({
  selector: 'scaffold-layout',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,

    SidenavMenuComponent,
    ToolbarComponent,
    ScaffoldFormPaneComponent
  ],
  template: `
    <scaffold-toolbar />
    <mat-sidenav-container>
      <mat-sidenav mode="side" [opened]="isSidenavOpen$ | async">
        <scaffold-sidenav-menu />
      </mat-sidenav>
      <mat-sidenav-content>
        <ng-content select=".content" />
      </mat-sidenav-content>
      
    </mat-sidenav-container>
    <scaffold-form-pane>
      <ng-content select=".form-pane-content">
      </ng-content>
    </scaffold-form-pane>
  `,
  styleUrls: [ './scaffold-layout.scss' ]
})
export class ScaffoldLayoutComponent {
  readonly state = inject(ScaffoldStateService);
  readonly _destroyRef = inject(DestroyRef)

  readonly isSidenavOpen$ = this.state.isSidenavDisabled$.pipe(
    map(disabled => !disabled)
  );

  ngOnInit() {
    const stateConnection = this.state.connect(this);

    this._destroyRef.onDestroy(() => {
      stateConnection.unsubscribe();
    });
  }
}
