import { Component, inject } from '@angular/core';
import { UserService } from '../../user';
import { AlterPasswordFormComponent, AlterPasswordRequest } from '../../common/alter-password-form.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'alter-password-page',
  standalone: true,
  imports: [
    AlterPasswordFormComponent
  ],
  template: `
    <user-alter-password-form
      hasCurrentPassword
      (save)="_handleAlterPasswordRequest($event)"
    />
  `,
})
export class AlterPasswordPage {
  readonly userService = inject(UserService);

  async _handleAlterPasswordRequest(request: AlterPasswordRequest) {
    try {
      const user = await firstValueFrom(
        this.userService.alterPassword(request),
      );
      return request.setSuccess(user);
    } catch (err) {
      return request.setFailure(err);
    }
  }
}
