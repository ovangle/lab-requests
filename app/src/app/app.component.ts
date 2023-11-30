import { Component, inject } from '@angular/core';
import { LoginService } from './oauth/login-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'lab_req';

  readonly loginContext = inject(LoginService);

}
