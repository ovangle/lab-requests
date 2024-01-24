import { Injectable, inject } from '@angular/core';
import { ModelContext } from '../common/model/context';
import {
  User,
  UserService,
  UserCollection,
  injectUserService,
  CurrentUser,
} from './common/user';
import {
  BehaviorSubject,
  Observable,
  filter,
  firstValueFrom,
  map,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { LoginContext } from '../oauth/login-context';
import { Role } from './common/role';
import { ResearchPlan } from '../research/plan/research-plan';
import { Lab } from '../lab/lab';
import { ModelPatch } from '../common/model/model';

@Injectable({ providedIn: 'root' })
export class UserContext extends ModelContext<User> {
  readonly userService = injectUserService();
  readonly loginContext = inject(LoginContext);

  override _doUpdate(id: string, patch: ModelPatch<User>): Promise<User> {
    return firstValueFrom(this.userService.update(id, patch));
  }

  readonly user = new BehaviorSubject<CurrentUser | null>(null);

  constructor() {
    super();

    this.loginContext.accessTokenData$
      .pipe(
        startWith(this.loginContext.currentAccessTokenData),
        switchMap((tokenData) =>
          tokenData != null ? this.userService.me() : of(null),
        ),
      )
      .subscribe(this.user);
  }

  get currentUser(): User | null {
    return this.user.value;
  }

  async hasRole(role: Role): Promise<boolean> {
    return !!this.currentUser?.roles?.has(role);
  }

  async login(credentials: { email: string; password: string }): Promise<User> {
    if (this.loginContext.isLoggedIn) {
      throw new Error('Already logged in');
    }

    await this.loginContext.loginNativeUser({
      username: credentials.email,
      password: credentials.password,
    });
    return await firstValueFrom(
      this.user.pipe(filter((user): user is CurrentUser => user != null)),
    );
  }

  logout(): Promise<void> {
    return this.loginContext.logout();
  }
}
