import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule} from '@angular/material/tabs';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, switchMap, tap } from 'rxjs';
import { LabContext } from '../lab-context';
import { LabService } from '../lab';
import { User, UserService } from 'src/app/user/user';
import { UserInfoComponent } from 'src/app/user/user-info.component';

function labFromActivatedRoute() {
  const activatedRoute = inject(ActivatedRoute);
  const labService = inject(LabService);
  const labContext = inject(LabContext);

  return activatedRoute.paramMap.pipe(
    map(paramMap => paramMap.get('lab_id')!),
    switchMap(labId =>labService.fetch(labId)),
    tap(lab => labContext.nextCommitted(lab)),
  );
}


@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatTabsModule,
    UserInfoComponent
  ],
  template: `
    @if (lab$ | async; as lab) {
      @let supervisors = supervisors$ | async;

      <h1>Lab {{lab.name}}</h1>

      <section class="lab-summary">
        <h2>Supervisors</h2>
          <mat-list>
            @for (supervisor of supervisors; track supervisor.id) {
              <user-info [user]="supervisor" />
            }
          </mat-list>
      </section>

      <main>

        <nav mat-tab-nav-bar [tabPanel]="tabPanel">
          <ng-template #navLinkTemplate let-label="label" let-link="link">
            <a mat-tab-link
                [routerLink]="[link]"
                routerLinkActive #rla="routerLinkActive"
                [active]="rla.isActive">
              {{label}}
            </a>
          </ng-template>

          <ng-container *ngTemplateOutlet="navLinkTemplate; context: {label: 'Dashboard', link: './'} " />
          <ng-container *ngTemplateOutlet="navLinkTemplate; context: {label: 'Equipment', link: './equipment'} " />
          <ng-container *ngTemplateOutlet="navLinkTemplate; context: {label: 'Software', link: './software'} " />
          <ng-container *ngTemplateOutlet="navLinkTemplate; context: {label: 'Materials', link: './material'} " />
        </nav>

        <mat-tab-nav-panel #tabPanel>
          <router-outlet></router-outlet>
        </mat-tab-nav-panel>
      </main>
    }
  `,
  animations: [],
  providers: [
    LabContext
  ]
})
export class LabDetailPage {
  readonly lab$ = labFromActivatedRoute();
  readonly _userService = inject(UserService);

  readonly supervisors$ = this.lab$.pipe(map(lab => lab.supervisors.items));
  readonly storages$ = this.lab$.pipe(map(lab => lab.storages.items));
  readonly disposals$ = this.lab$.pipe(map(lab => lab.disposals.items));
}
