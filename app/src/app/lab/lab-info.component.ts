import { CommonModule } from "@angular/common";
import { Component, inject, input } from "@angular/core";
import { Lab, LabService } from "./lab";
import { modelId, ModelRef } from "../common/model/model";
import { toObservable } from "@angular/core/rxjs-interop";
import { map, shareReplay, switchMap } from "rxjs";


@Component({
    selector: 'lab-info',
    standalone: true,
    imports: [
        CommonModule
    ],
    template: `
    @if (lab$ | async; as lab) {
        {{lab.name}}
    }
    `
})
export class LabInfoComponent {
    readonly _labService = inject(LabService);

    readonly lab = input.required<ModelRef<Lab>>();
    readonly lab$ = toObservable(this.lab).pipe(
        switchMap(labRef => {
            return this._labService.fetch(modelId(labRef))
        }),
        shareReplay(1)
    );
}