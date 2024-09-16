import { Component, DestroyRef, Directive, TemplateRef, computed, contentChild, inject, input, signal } from "@angular/core";
import { LabInstallation, LabInstallationService } from "./installation";
import { Installable, LabInstallableService } from "./installable";
import { LabProvision } from "../provisionable/provision";
import { LabService } from "../../lab";
import { toObservable } from "@angular/core/rxjs-interop";
import { BehaviorSubject, switchMap } from "rxjs";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { LabInfoComponent } from "../../lab-info.component";
import { coerceBooleanProperty } from "@angular/cdk/coercion";

export type LabInstallationInfoDisplay = 'list-item';


@Component({
    selector: 'lab-installation-info',
    standalone: true,
    imports: [
        CommonModule,

        MatButtonModule,
        MatIconModule,
        MatListModule,

        LabInfoComponent
    ],
    template: `
    <div class="title">
        <ng-content select="installable-info" />

        @if (lab$ | async; as lab) {
            <lab-info [lab]="lab" />
        }
    </div>
    <div class="details">
        <ng-content select="installation-details" />

        @if (!hideProvisions()) {
            <div class="provision-details">
                @if (activeProvisions().totalItemCount === 0) {
                    <p>No active provisions</p>
                } @else {
                    <p>
                        Has active provisions
                        <button mat-icon-button (click)="provisionsVisibleToggleClicked()">
                            <mat-icon></mat-icon>
                        </button>
                    </p>

                }
            </div>
        }
    </div>

    <ng-content select="provisionDetail" />

    @if (provisionsDetailVisible()) {
        <mat-list>
        @for (provision of activeProvisions().items; track provision.id) {
            <mat-list-item>
                <ng-container *ngTemplateOutlet="provisionDetailTemplate(); context: {$implicit: provision}" />
            </mat-list-item>
        }
        </mat-list>
    }
    `
})
export class LabInstallationInfoComponent<
    TInstallable extends Installable<any>,
    TInstallation extends LabInstallation<TInstallable, any, any>
> {
    _labService = inject(LabService);
    _destroy = inject(DestroyRef);
    _installableService = inject(LabInstallableService<TInstallable>);

    installation = input.required<TInstallation>();
    hideProvisions = input(false, {transform: coerceBooleanProperty});

    display = input<LabInstallationInfoDisplay>('list-item');

    provisionDetailTemplate = contentChild.required('provisionDetail', { read: TemplateRef });
    readonly lab$ = toObservable(this.installation).pipe(
        switchMap(installation => this._labService.fetch(installation.labId))
    );

    readonly activeProvisions = computed(() => this.installation().activeProvisions);

    provisionsDetailVisible = signal<boolean>(false);

    provisionsVisibleToggleClicked() {
        const isVisible = this.provisionsDetailVisible();
        this.provisionsDetailVisible.set(!isVisible);
    }
}
