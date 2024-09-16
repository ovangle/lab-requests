import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { LabDisposal } from "./lab-disposal";


@Component({
    selector: 'lab-disposal-info',
    standalone: true,
    template: `
    Disposal {{ disposal().strategy.name }}
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabDisposalInfoComponent {
    readonly disposal = input.required<LabDisposal>();
}