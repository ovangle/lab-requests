import { Component, inject } from "@angular/core";
import { BehaviorSubject, Subject, shareReplay, switchMap, tap } from "rxjs";
import { ExperimentalPlanService } from "../common/experimental-plan";


interface Actor {
    readonly role: string;
    readonly email: string;
}

const researcherFixture = {
    role: 'researcher',
    email: 'a@researcher'
}


@Component({
    selector: 'lab-experimental-plan-index',
    template: `
    <div *ngIf="actor$ | async as actor">{{actor | json}}</div>

    <a mat-button routerLink="./create">
        + Add
    </a>

    <mat-list *ngIf="items$ | async as items">
        <mat-list-item *ngFor="let item of items">
            <a routerLink="./{{item.id}}">{{item.title}}</a>
        </mat-list-item>
    </mat-list>
    `
})
export class ExperimentalPlanIndexPage {
    readonly _models = inject(ExperimentalPlanService);

    readonly actorSubject = new BehaviorSubject<Actor>(researcherFixture);

    readonly actor$ = this.actorSubject.pipe(
        shareReplay(1)
    );

    readonly items$ = this.actor$.pipe(
        switchMap(actor => {
            if (actor.role === 'technician') {
                return this._models.query({technician: actor.email});
            } else if (actor.role === 'researcher') {
                return this._models.query({researcher: actor.email})
            } else if (actor.role === 'supervisor') {
                return this._models.query({supervisor: actor.email})
            }
            // Not authorized?
            return [];
        }),
        shareReplay(1)
    );
}