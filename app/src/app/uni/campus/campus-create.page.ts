import { Component, Injectable, OnDestroy, OnInit, inject } from "@angular/core";
import { Campus, CampusContext } from "./campus";
import { Observable, Subscription, of } from "rxjs";
import { CampusFormComponent } from "./campus-patch-form.component";

@Injectable()
export class CampusCreateContext extends CampusContext {
    override fromContext$: Observable<Campus | null> = of(null);
}

@Component({
    standalone: true,
    imports: [
        CampusFormComponent
    ],
    template: `
        <h1>Create campus</h1>
        <app-uni-campus-patch-form></app-uni-campus-patch-form>
    `,
    providers: [
        { provide: CampusContext, useClass: CampusCreateContext }
    ]
})
export class CampusCreatePage implements OnDestroy {
    context = inject(CampusContext);
    _contextConnection: Subscription;

    constructor() {
        this._contextConnection = this.context.connect();
    }

    ngOnDestroy() {
        this._contextConnection.unsubscribe();
    }

}