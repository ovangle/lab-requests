import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { Service } from "./service";


@Component({
    selector: 'lab-service-resource-details',
    standalone: true,
    imports: [
        CommonModule
    ],
    template: ``
})
export class ServiceResourceDetailsComponent {
    @Input()
    service: Service;
}