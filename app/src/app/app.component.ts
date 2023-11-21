import { Component } from '@angular/core';
import { LoginService } from './oauth/login-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'lab_req';

  constructor(
    readonly loginContext: LoginService
  ) {}

  ngOnInit() {
    this.loginContext.init().catch(() => {
      console.log('login context failed to initialized');
    });
  }
}
