import { Component, inject } from '@angular/core';
import { UserContext } from '../../user-context';
import { filter, map, shareReplay } from 'rxjs';
import { CurrentUser, User } from '../../common/user';
import { CommonModule } from '@angular/common';
import { LabListComponent } from 'src/app/lab/lab-list.component';
import { ResearchPlanListComponent } from 'src/app/research/plan/research-plan-list.component';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'user-home-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    MatButtonModule,

    LabListComponent,
    ResearchPlanListComponent
  ],
  template: `
    <div class="labs-container">
      <h1>Labs</h1>

      @if (labs$ | async; as labs) {
        <lab-list [labs]="labs" />
      }
    </div>

    <div class="plans-container">
      <h1>Plans</h1>

      @if (plans$ | async; as plans) {
        <research-plan-list [plans]="plans" />
      }
    </div>

    <button mat-button [routerLink]="['/user', 'create-temporary']">
      Add student user
    </button>
  `,
})
export class UserHomePage {
  readonly userContext = inject(UserContext);

  readonly currentUser$ = this.userContext.user.pipe(
    filter((u): u is CurrentUser => u != null),
    shareReplay(1),
  );

  readonly labs$ = this.currentUser$.pipe(map((user) => user.labs.items));
  readonly plans$ = this.currentUser$.pipe(map((user) => user.plans.items));
}
