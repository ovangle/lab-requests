import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { ProvisionStatus } from "./provision-status";
import { ProvisionStatusPipe } from "./provision-status.pipe";
import { UserService } from "src/app/user/user";
import { toObservable } from "@angular/core/rxjs-interop";
import { switchMap } from "rxjs";
import { UserInfoComponent } from "src/app/user/user-info.component";
import { AsyncPipe, DatePipe } from "@angular/common";
import { ProvisionEvent } from "./provision";


@Component({
    selector: 'lab-provision-event-info',
    standalone: true,
    imports: [
        AsyncPipe,
        DatePipe,
        ProvisionStatusPipe,
        UserInfoComponent
    ],
    template: `
    <div class="title">{{ status() | provisionStatus }}</div>
    <div class="details">
        @if (by$ | async; as byUser) {
            <div class="by"><user-info [user]="byUser" /></div>
        }
        <div class="at">
            at: {{at() | date}}
        </div>
        @if (note()) {
            <div class="note-info">
                <div class="note-title">Note</div>
                <p>{{note()}}</p>
            </div>
        }
    </div>
    `
})
export class ProvisionEventInfoComponent {
    _userService = inject(UserService);

    event = input.required<ProvisionEvent>();

    status = computed(() => this.event().status);

    by$ = toObservable(this.event).pipe(
        switchMap(event => this._userService.fetch(event.byId))
    );

    at = computed(() => this.event().at);
    note = computed(() => this.event().note);
}