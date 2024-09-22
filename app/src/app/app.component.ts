import { Component, inject } from '@angular/core';
import { LoginContext } from './oauth/login-context';

@Component({
  selector: 'app-root',
  template: `
    <scaffold-layout>
      <div class="content" role="main">
        <router-outlet name="default" />
      </div>

      <div class="form-pane-content">
        <router-outlet name="form" />
      </div>
    </scaffold-layout>
  `,
  styles: `
  .content {
    height: 100%;
  }
  `
})
export class AppComponent {
  title = 'lab_req';

  readonly loginContext = inject(LoginContext);
}
