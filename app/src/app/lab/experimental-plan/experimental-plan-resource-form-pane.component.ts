import { CommonModule } from "@angular/common";
import { Component, ViewChild } from "@angular/core";
import { ExperimentalPlanModule } from "./experimental-plan.module";
import { MatTabNavPanel } from "@angular/material/tabs";


@Component({
    selector: 'lab-experimental-plan-resource-form-pane',
    standalone: true,
    imports: [
        CommonModule,
        ExperimentalPlanModule
    ],
    template: `
        <router-outlet></router-outlet> 
    `
})
export class ResourceFormPane {
}