import { Component, inject } from '@angular/core';
import { LoginContext } from './oauth/login-context';

@Component({
  selector: 'app-root',
  template: `
    <scaffold-layout>
      <div class="content" role="main">
        <router-outlet></router-outlet>
      </div>
    </scaffold-layout>
  `,
})
export class AppComponent {
  title = 'lab_req';

  readonly loginContext = inject(LoginContext);
}
