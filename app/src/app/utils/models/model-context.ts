import { Injectable } from "@angular/core";
import { BehaviorSubject, EMPTY, NEVER, Observable, ReplaySubject, Subject, Subscription, connectable, firstValueFrom, of, shareReplay } from "rxjs";
import { ModelService } from "./model-service";
import { isWorkUnitCreate } from "src/app/lab/work-unit/work-unit";

@Injectable()
export abstract class Context<T extends { readonly id: string}, TPatch = unknown, TCreate extends TPatch = TPatch> {
    abstract readonly models: ModelService<T, TPatch, TCreate>;

    readonly committedSubject = new ReplaySubject<T | null>(1);
    readonly committed$: Observable<T | null> = this.committedSubject.asObservable();

    constructor(_parentContext?: Context<T>) {
        if (_parentContext) {
            this.committedSubject = _parentContext.committedSubject;
            this.committed$ = _parentContext.committed$;
            this._doCreate = _parentContext._doCreate.bind(this);
            this._doCommit = _parentContext._doCommit.bind(this);
        }
    }

    sendCommitted(setCommitted$: Observable<T | null>): Subscription {
        console.log('setCommitted$', setCommitted$);
        return setCommitted$.subscribe(
            (committed) => {
                console.log('committed', committed);
                this.committedSubject.next(committed)
            }
        );
    }

    initCreateContext() {
        this.sendCommitted(of(null));
    }

    abstract _doCreate(request: TCreate): Observable<T>;

    async create(request: TCreate): Promise<T> {
        const current = await firstValueFrom(this.committed$);
        if (current != null) {
            throw new Error('Cannot create in context. Context already has a current committed value')
        }
        const committed = await firstValueFrom(this._doCreate(request));
        console.log('emitting committed');
        this.committedSubject.next(committed);
        return committed;
    }

    abstract _doCommit(identifier: string, patch: TPatch): Observable<T>;

    async commit(patch: TPatch): Promise<T> {
        const current = await firstValueFrom(this.committed$);
        if (current == null) {
            // Should create
            throw new Error('Cannot commit patch in an empty context');
        }
        const committed = await firstValueFrom(this._doCommit(current.id, patch));
        this.committedSubject.next(committed);
        return committed;
    }
}



