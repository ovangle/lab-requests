import { Component, Injectable, OnDestroy, OnInit, inject } from "@angular/core";
import { Campus, CampusContext } from "../campus";
import { Observable, Subscription, of } from "rxjs";
import { CampusFormComponent } from "../campus-form.component";

@Component({
    standalone: true,
    imports: [
        CampusFormComponent
    ],
    template: `
        <h1>Create campus</h1>
        <uni-campus-form></uni-campus-form>
    `,
    providers: [
        CampusContext
    ]
})
export class CampusCreatePage implements OnDestroy {
    context = inject(CampusContext);
    _contextConnection: Subscription;

    constructor() {
        this._contextConnection = this.context.sendCommitted(of(null));
    }

    ngOnDestroy() {
        this._contextConnection.unsubscribe();
    }

}