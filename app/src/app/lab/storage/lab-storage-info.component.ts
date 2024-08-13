import { Component, inject, input } from "@angular/core";
import { LabStorage } from "./lab-storage";
import { StorageTypePipe } from "./lab-storage-type.pipe";
import { LabInfoComponent } from "../lab-info.component";
import { toObservable } from "@angular/core/rxjs-interop";
import { switchMap } from "rxjs";
import { LabService } from "../lab";
import { CommonModule } from "@angular/common";


@Component({
    selector: 'lab-storage-info',
    standalone: true,
    imports: [
        CommonModule,
        StorageTypePipe,
        LabInfoComponent
    ],
    template: `
    <div class="lab-info">
        <span class="lab-info-title">Lab: </span>
        <span class="lab-info-content">@if (lab$ | async; as lab) { <lab-info [lab]="lab" /> }</span>
    </div>
    Type: {{ storage().storageType | labStorageType}}
    `

})
export class LabStorageInfoComponent {
    storage = input.required<LabStorage>();

    _labService = inject(LabService);
    lab$ = toObservable(this.storage).pipe(
        switchMap(storage => storage.resolveLab(this._labService))
    );
}