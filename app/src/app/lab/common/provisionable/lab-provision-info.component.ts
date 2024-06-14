import { Component, inject, input } from "@angular/core";
import { LabService } from "../../lab";
import { LabInstallation } from "../installable/installation";
import { LabProvision } from "./provision";
import { Provisionable } from "./provisionable";


@Component({
    selector: 'lab-provision-info',
    standalone: true,
    imports: [],
    template: `
    `
}) export class LabProvisionInfoComponent<
    TProvisionable extends Provisionable<any>,
    TProvision extends LabProvision<TProvisionable>
> {
    protected readonly _labService = inject(LabService);

    readonly provisionable = input.required<TProvisionable>();
    readonly provision = input.required<TProvision>();
}