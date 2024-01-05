import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { UserContext } from '../user-context';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'user-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatMenuModule],
  template: `
    @if (isLoggedIn) {
      <button mat-button [matMenuTriggerFor]="menu">{{ userFullName }}</button>
    } @else {
      <button mat-button [disabled]="loginDisabled" [routerLink]="loginLink">
        Login
      </button>
    }

    <mat-menu #menu>
      <a mat-menu-item [routerLink]="alterPasswordLink">Alter password</a>
      <a mat-menu-item [routerLink]="logoutLink">Logout</a>
    </mat-menu>
  `,
})
export class UserMenuComponent {
  @Input({ required: true })
  get isLoggedIn() {
    return this._isLoggedIn;
  }
  set isLoggedIn(value: BooleanInput) {
    this._isLoggedIn = coerceBooleanProperty(value);
  }
  _isLoggedIn: boolean;

  @Input()
  get loginDisabled() {
    return this._loginDisabled;
  }
  set loginDisabled(input: BooleanInput) {
    this._loginDisabled = coerceBooleanProperty(input);
  }
  _loginDisabled: boolean;

  @Input({ required: true })
  userFullName: string | null;

  @Input({ required: true })
  userFeatureLink: string[];

  get loginLink() {
    return [...this.userFeatureLink, 'login'];
  }

  get logoutLink() {
    return [...this.userFeatureLink, 'logout'];
  }

  get alterPasswordLink() {
    return [...this.userFeatureLink, 'alter-password'];
  }
}
