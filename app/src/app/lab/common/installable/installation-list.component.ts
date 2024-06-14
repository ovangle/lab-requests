import { Component, TemplateRef, contentChild, effect, inject, input } from "@angular/core";
import { Installable } from "./installable";
import { LabInstallation, LabInstallationService } from "./installation";
import { LabQuery } from "../../lab";
import { Observable, combineLatest, defer, switchMap } from "rxjs";
import { toObservable } from "@angular/core/rxjs-interop";
import { ModelIndexPage } from "src/app/common/model/model";
import { MatListModule } from "@angular/material/list";
import { CommonModule } from "@angular/common";
import { LabInstallationIndex } from "./lab-installation-index";


@Component({
    selector: 'lab-installation-list',
    standalone: true,
    imports: [
        CommonModule,
        MatListModule
    ],
    template: `
    @if (index.pageItems$ | async; as installations) {
    <mat-list>
        @for (item of installations; track item.id) {
            <mat-list-item>
                <ng-container *ngTemplateOutlet="
                    itemTemplate(); 
                    context: {$implicit: item}
                " 
                />
            </mat-list-item>
        }
    </mat-list>
    }
    `,
})
export class LabInstallationListComponent<
    TInstallable extends Installable<any>,
    TInstallation extends LabInstallation<any, any>
> {
    installable = input.required<TInstallable>();
    labQuery = input<Partial<LabQuery>>({});

    index = inject(LabInstallationIndex);

    itemTemplate = contentChild.required('installationTemplate', { read: TemplateRef<{ $implicit: TInstallation }> });

    constructor() {
        effect(() => {
            this.index.setQueryKey('installable', this.installable());
            this.index.patchQuery(this.labQuery());
        });
    }
}