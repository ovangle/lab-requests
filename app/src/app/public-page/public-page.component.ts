import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { LoginContext } from '../oauth/login-context';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { ScaffoldStateService } from '../scaffold/scaffold-state.service';

@Component({
  selector: 'app-public-page',
  standalone: true,
  imports: [RouterModule, MatButtonModule],
  template: `
    <div>
      ABANDON ALL HOPE YE WHO <a routerLink="/oauth/login">ENTER HERE</a>
    </div>
  `,
  styles: `
    :host {
        display: flex;     
        justify-content: center;
        align-items: center;
        height: 100%;
    }
    `,
})
export class PublicPageComponent {

}
