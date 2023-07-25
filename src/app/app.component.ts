import { Component } from '@angular/core';
import { LoginContext } from './oauth/login-context';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'lab_req';

  constructor(
    readonly loginContext: LoginContext
  ) {}

  ngOnInit() {
    this.loginContext.init().catch(() => {
      console.log('login context failed to initialized');
    });
  }
}
