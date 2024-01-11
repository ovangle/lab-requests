import { Component, inject } from '@angular/core';
import { UserContext } from '../user-context';
import { filter, map, shareReplay } from 'rxjs';
import { User } from '../common/user';
import { CommonModule } from '@angular/common';
import { LabListComponent } from 'src/app/lab/common/lab-list.component';

@Component({
  selector: 'user-home-page',
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
  `,
})
export class UserHomePage {
  readonly userContext = inject(UserContext);

  readonly user$ = this.userContext.user.pipe(
    filter((u): u is User => u != null),
    shareReplay(1),
  );

  // TODO: CurrentUser
  readonly labs$ = this.user$.pipe(map((user) => /* user.labs */ []));
  readonly plans$ = this.user$.pipe(map((user) => /* user.activePlans */ []));
}
