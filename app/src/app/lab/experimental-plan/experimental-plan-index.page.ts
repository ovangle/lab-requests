import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MatListModule } from "@angular/material/list";
import { ExperimentalPlanModelService } from "./experimental-plan";
import { BehaviorSubject, Subject, shareReplay, switchMap, tap } from "rxjs";
import { RouterModule } from "@angular/router";


interface Actor {
    readonly role: string;
    readonly email: string;
}

const researcherFixture = {
    role: 'researcher',
    email: 'hello@world.com'
}


@Component({
    selector: 'lab-experimental-plan-index',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,

        MatListModule
    ],
    template: `
    <div *ngIf="actor$ | async as actor">{{actor | json}}</div>

    <mat-list *ngIf="items$ | async as items">
        <mat-list-item *ngFor="let item of items">
            <a routerLink="./{{item.id}}">{{item.title}}</a>
        </mat-list-item>
    </mat-list>
    `
})
export class ExperimentalPlanIndexPage {
    readonly _models = inject(ExperimentalPlanModelService);

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
        tap(console.log),
        shareReplay(1)
    );
}