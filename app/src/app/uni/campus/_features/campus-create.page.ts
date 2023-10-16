import { Component, Injectable, OnDestroy, OnInit, inject } from "@angular/core";
import { Observable, Subscription, of } from "rxjs";
import { CampusFormComponent } from "../campus-form.component";
import { CampusService } from "../common/campus";

@Component({
    standalone: true,
    imports: [
        CampusFormComponent
    ],
    template: `
        <h1>Create campus</h1>
        <uni-campus-form></uni-campus-form>
    `,
})
export class CampusCreatePage {
    readonly service = inject(CampusService);
}