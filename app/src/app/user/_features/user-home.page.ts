import { Component, inject } from '@angular/core';
import { UserContext } from '../user-context';
import { filter, map } from 'rxjs';
import { User } from '../common/user';

@Component({
  selector: 'user-home-page',
  template: ``,
})
export class UserHomePage {
  readonly userContext = inject(UserContext);

  readonly labs$ = this.userContext.user.pipe(
    filter((u): u is User => u != null),
    map((user) => user.labs)
  );
}
