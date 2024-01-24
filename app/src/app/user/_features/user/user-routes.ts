import { Routes } from '@angular/router';

export const USER_ROUTES: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./user-home.page')
      .then(module => module.UserHomePage),
  },
  {
    path: 'alter-password',
    loadComponent: () => import('./alter-password.page')
      .then(module => module.AlterPasswordPage)
  },
  {
    path: 'login',
    redirectTo: '/oauth/login',
  },
  {
    path: 'logout',
    redirectTo: '/oauth/logout',
  },
  {
    path: 'create-temporary',
    loadComponent: () => import('./create-temporary-user.page')
      .then(module => module.CreateTemporaryUserPage)
  }
];

