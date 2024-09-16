import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { LabContext } from "../lab-context";
import { CommonModule } from "@angular/common";
import { MatListModule } from "@angular/material/list";
import { map } from "rxjs";
import { UserInfoComponent } from "src/app/user/user-info.component";
import { LabStorageInfoComponent } from "../common/storable/lab-storage-info.component";
import { LabDisposalInfoComponent } from "../common/disposable/lab-disposal-info.component";



@Component({
    standalone: true,
    imports: [
        CommonModule,
        MatListModule,

        UserInfoComponent,
        LabStorageInfoComponent,
        LabDisposalInfoComponent
    ],
    template: `
    @if (lab$ | async; as lab) {

        <div class="lab-supervisors">
            <h3>Supervisors</h3>
            @let supervisors = supervisors$ | async;
            <mat-list>
                @for (supervisor of supervisors; track supervisor.id) {
                    <mat-list-item>
                        <user-info [user]="supervisor" />
                    </mat-list-item>
                }

            </mat-list>
        </div>
        <div class="lab-storage">
            <h3>Storages</h3>
            @let storages = storages$ | async;

            @if (storages!.length > 0) {
            <mat-list>
                @for (storage of storages; track storage.id) {
                    <mat-list-item>
                        <lab-storage-info [storage]="storage" />
                    </mat-list-item>
                }
            </mat-list>
            } @else {
                <p>Lab has no storages</p>
            }
        </div>

        <div class="lab-disposal-infos">
            @let disposals = disposals$ | async;
            <h3>Disposals</h3>

            @if (disposals!.length > 0) {
                <mat-list>
                    @for (disposal of disposals; track disposal.id) {
                        <mat-list-item>
                            <lab-disposal-info [disposal]="disposal" />
                        </mat-list-item>
                    }
                </mat-list>
            } @else {
                <p>Lab has no disposals</p>
            }
        </div>
    }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabDetail__Dashboard {
    readonly _labContext = inject(LabContext);
    readonly lab$ = this._labContext.committed$;

    readonly supervisors$ = this.lab$.pipe(map(lab => lab.supervisors.items));

    readonly storages$ = this.lab$.pipe(map(lab => lab.storages.items));
    readonly disposals$  = this.lab$.pipe(map(lab => lab.disposals.items));


}