import { Component, inject } from '@angular/core';
import { UserContext } from '../user-context';
import { filter, map } from 'rxjs';
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
  `,
})
export class UserHomePage {
  readonly userContext = inject(UserContext);

  readonly labs$ = this.userContext.user.pipe(
    filter((u): u is User => u != null),
    map((user) => user.labs)
  );
}
