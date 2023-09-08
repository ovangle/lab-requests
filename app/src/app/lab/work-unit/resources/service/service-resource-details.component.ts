import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { Service } from "./service";


@Component({
    selector: 'lab-req-service-resource-details',
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