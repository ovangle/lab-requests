import { Component, input } from "@angular/core";
import { Lab } from "./lab";


@Component({
    selector: 'lab-info',
    standalone: true,
    imports: [

    ],
    template: `
        <div class="name">{{lab().name}}</div>
    `
})
export class LabInfoComponent {
    lab = input.required<Lab>()
}