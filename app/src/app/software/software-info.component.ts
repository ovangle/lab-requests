import { Component, computed, inject, input, ɵINPUT_SIGNAL_BRAND_WRITE_TYPE } from "@angular/core";
import { Software } from "./software";
import { AsyncPipe } from "@angular/common";
import { toObservable } from "@angular/core/rxjs-interop";
import { switchMap } from "rxjs";

export type SoftwareInfoDisplayStyle = 'list-item' | 'full-page';

@Component({
    selector: 'software-info',
    standalone: true,
    imports: [
        AsyncPipe,

    ],
    template: `
    @switch (displayStyle()) {
        @case ('list-item') {
            <div class="line-1">
                <em>{{software().name}}</em>
            </div>
        }
    }
    `
})
export class SoftwareInfoComponent {
    software = input.required<Software>();

    displayStyle = input<SoftwareInfoDisplayStyle>('list-item');
}

