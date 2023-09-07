import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subscription, combineLatest, filter, firstValueFrom, switchMap, take, tap } from "rxjs";
import { ModelService } from "./model-service";


@Injectable()
export abstract class Context<T extends { readonly id: string}, TPatch = unknown, TCreate extends TPatch = TPatch> {
    abstract readonly models: ModelService<T, TPatch, TCreate>;

    abstract readonly fromContext$: Observable<T>;
    readonly committedSubject = new BehaviorSubject<T | null>(null);

    readonly committed$: Observable<T> = this.committedSubject.pipe(
        filter((obj): obj is T => obj != null)
    );

    connect(): Subscription {
        this.fromContext$.subscribe(this.committedSubject);

        return new Subscription(() => {
            this.committedSubject.complete();
        })
    }

    abstract create(patch: TPatch): Promise<T>; 

    _commit(patch: TPatch): Observable<T> {
        return this.committedSubject.pipe(
            take(1), 
            switchMap(committed => {
                if (committed) {
                    return this.models.update(committed.id, patch);
                }
                return this.create(patch);
            }),
            tap((nextCommitted) => this.committedSubject.next(nextCommitted))
        );
    }

    async commit(patch: TPatch): Promise<T> {
        return await firstValueFrom(this._commit(patch));
    }
}

