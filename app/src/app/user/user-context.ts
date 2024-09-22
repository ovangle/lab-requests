import { DestroyRef, Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  filter,
  firstValueFrom,
  of,
  startWith,
  switchMap,
  tap
} from 'rxjs';
import { ModelContext } from '../common/model/context';
import { LoginContext } from '../oauth/login-context';
import { Role } from './common/role';
import {
  CurrentUser,
  User,
  UserService,
} from './user';

@Injectable({ providedIn: 'root' })
export class UserContext extends ModelContext<CurrentUser> {
  readonly loginContext: LoginContext;

  get user() {
    return this.committed$;
  }

  constructor() {
    const loginContext = inject(LoginContext);
    const userService = inject(UserService);

    super(
      userService as any,
      loginContext.accessTokenData$.pipe(
        startWith(loginContext.currentAccessTokenData),
        switchMap((tokenData) => tokenData != null ? userService.me() : of(null)),
      )
    );

    this.loginContext = loginContext;
    const syncCurrentUser = this.committed$.subscribe((u) => this._currentUser.next(u as CurrentUser));
    inject(DestroyRef).onDestroy(() => {
      syncCurrentUser.unsubscribe();
    })
  }

  readonly _currentUser = new BehaviorSubject<CurrentUser | null>(null);
  get currentUser(): User | null {
    return this._currentUser.value;
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
