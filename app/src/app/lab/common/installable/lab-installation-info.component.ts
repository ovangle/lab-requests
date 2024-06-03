import { Component, DestroyRef, Directive, TemplateRef, computed, contentChild, inject, input, signal } from "@angular/core";
import { LabInstallation } from "./installation";
import { Installable } from "./installable";
import { LabProvision } from "../provisionable/provision";
import { LabInfoComponent } from "../../lab-info.component";
import { LabService } from "../../lab";
import { toObservable } from "@angular/core/rxjs-interop";
import { BehaviorSubject, switchMap } from "rxjs";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";

export type LabInstallationInfoDisplay = 'list-item';


@Component({
    selector: 'lab-installation-info',
    standalone: true,
    imports: [
        CommonModule,

        MatButtonModule,
        MatIconModule,
        MatListModule,

        LabInfoComponent,
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

        <div class="provision-details">
            @if (currentProvisions().length === 0) {
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
    </div>

    <ng-content select="provisionDetail" />

    @if (provisionsDetailVisible()) {
        <mat-list>
        @for (provision of currentProvisions(); track provision.id) {
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
    TInstallation extends LabInstallation<TInstallable, any>
> {
    _labService = inject(LabService);
    _destroy = inject(DestroyRef);

    installation = input.required<TInstallation>();
    installable = computed(() => this.installation().installable);

    display = input<LabInstallationInfoDisplay>('list-item');

    provisionDetailTemplate = contentChild.required('provisionDetail', { read: TemplateRef });
    readonly lab$ = toObservable(this.installation).pipe(
        switchMap(installation => installation.resolveLab(this._labService))
    );

    readonly currentProvisions = computed(() => this.installation().currentProvisions);

    provisionsDetailVisible = signal<boolean>(false);

    provisionsVisibleToggleClicked() {
        const isVisible = this.provisionsDetailVisible();
        this.provisionsDetailVisible.set(!isVisible);
    }
}
