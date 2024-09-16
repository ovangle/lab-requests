import { Component, inject, input } from "@angular/core";
import { LabStorage } from "./lab-storage";
import { toObservable } from "@angular/core/rxjs-interop";
import { switchMap } from "rxjs";
import { LabService } from "../../lab";
import { CommonModule } from "@angular/common";


@Component({
    selector: 'lab-storage-info',
    standalone: true,
    imports: [
        CommonModule,
    ],
    template: `
        {{ storage().strategy.name }} storage
    `

})
export class LabStorageInfoComponent {
    storage = input.required<LabStorage>();
}