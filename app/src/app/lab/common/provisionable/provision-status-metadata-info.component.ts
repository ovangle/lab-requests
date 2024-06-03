import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { ProvisionStatus, ProvisionStatusMetadata } from "./provision-status";
import { ProvisionStatusPipe } from "./provision-status.pipe";
import { UserService } from "src/app/user/common/user";
import { toObservable } from "@angular/core/rxjs-interop";
import { switchMap } from "rxjs";
import { UserInfoComponent } from "src/app/user/user-info.component";
import { AsyncPipe, DatePipe } from "@angular/common";


@Component({
    selector: 'lab-provision-status-metadata-info',
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
export class ProvisionStatusMetadataInfoComponent<TStatus extends ProvisionStatus> {
    _userService = inject(UserService);

    metadata = input.required<ProvisionStatusMetadata<TStatus>>();

    status = computed(() => this.metadata().status);

    by$ = toObservable(this.metadata).pipe(
        switchMap(metadata => metadata.resolveBy(this._userService))
    );

    at = computed(() => this.metadata().at);
    note = computed(() => this.metadata().note);
}