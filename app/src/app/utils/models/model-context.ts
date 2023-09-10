import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subject, Subscription, combineLatest, defer, filter, firstValueFrom, shareReplay, switchMap, take, tap } from "rxjs";
import { ModelService } from "./model-service";

@Injectable()
export abstract class Context<T extends { readonly id: string}, TPatch = unknown, TCreate extends TPatch = TPatch> {
    abstract readonly models: ModelService<T, TPatch, TCreate>;

    readonly committedSubject = new BehaviorSubject<T | null>(null);
    readonly committed$: Observable<T | null> = this.committedSubject.pipe(
        shareReplay(1)
    );

    connect(fromContext$: Observable<T | null>): Subscription {
        fromContext$.subscribe(this.committedSubject);
        const keepaliveCommitted = this.committed$.subscribe();

        return new Subscription(() => {
            this.committedSubject.complete();
            keepaliveCommitted.unsubscribe();
        })
    }

    abstract _doCreate(request: TCreate): Observable<T>;

    async create(request: TCreate): Promise<T> {
        const committed = await firstValueFrom(this.committed$);
        if (committed != null) {
            throw new Error('Cannot create in context. Context already has a current committed value')
        }
        return await firstValueFrom(this._doCreate(request));
    }

    abstract _doCommit(identifier: string, patch: TPatch): Observable<T>;

    async commit(patch: TPatch): Promise<T> {
        const committed = await firstValueFrom(this.committed$);
        if (committed == null) {
            // Should create
            throw new Error('Cannot commit patch in an empty context');
        }
        return await firstValueFrom(this._doCommit(committed.id, patch));
    }

    async reset(): Promise<void> {
        this.committedSubject.next(this.committedSubject.value);
    }
}



