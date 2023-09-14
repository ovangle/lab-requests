import { Injectable } from "@angular/core";
import { BehaviorSubject, EMPTY, NEVER, Observable, Subject, Subscription, connectable, firstValueFrom, shareReplay } from "rxjs";
import { ModelService } from "./model-service";

@Injectable()
export abstract class Context<T extends { readonly id: string}, TPatch = unknown, TCreate extends TPatch = TPatch> {
    abstract readonly models: ModelService<T, TPatch, TCreate>;

    readonly committedSubject = new BehaviorSubject<T | null>(null);
    readonly committed$: Observable<T | null> = this.committedSubject.pipe(
        shareReplay(1)
    );

    sendCommitted(setCommitted$: Observable<T | null>): Subscription {
        return setCommitted$.subscribe(
            (committed) => this.committedSubject.next(committed)
        );
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



