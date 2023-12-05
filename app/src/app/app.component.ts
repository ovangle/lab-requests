import { Component, inject } from '@angular/core';
import { LoginContext } from './oauth/login-context';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'lab_req';

  readonly loginContext = inject(LoginContext);

}
