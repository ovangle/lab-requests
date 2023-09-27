import { Inject, Injectable, Optional, SkipSelf } from "@angular/core";
import { BehaviorSubject, Observable, defer } from "rxjs";

export const ROLES = [
    'academic',
    'admin',
    'lab-technician',
    'student',
];
export type Role = typeof ROLES[number];

// An actor is a combination of a user and a role.
export interface Actor {
    readonly email: string;
    readonly role: Role;
}

@Injectable()
export class ActorContext {
    // There can be at most one global actor.
    readonly _actor = new BehaviorSubject<Actor | null>(null);
    readonly actor$ = this._actor.asObservable();

    get isPublic() {
        return this._actor.value == null;
    }

    constructor(
        @Inject(ActorContext) @Optional() @SkipSelf()
        parentContext: ActorContext | null
    ) {
        if (parentContext != null) {
            throw new Error('Cannot nest actor contexts');
        }
    }

    sendActor(actor$: Observable<Actor | null>) {
        actor$.subscribe((actor) => this._actor.next(actor));
    }
}