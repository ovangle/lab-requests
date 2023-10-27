import { DestroyRef, Inject, Injectable, InjectionToken, Optional, Provider, Type, inject } from "@angular/core";
import { Model, ModelParams, ModelPatch } from './model';
import { ModelCollection } from "./model-collection";
import { Connectable, Observable, ReplaySubject, Subscription, connectable, firstValueFrom } from "rxjs";
import { ModelService } from "./model-service";


@Injectable()
export abstract class ModelContext<T extends Model, TPatch extends ModelPatch<T> = ModelPatch<T>> {
    readonly committedSubject = new ReplaySubject<T>(1);
    readonly committed$: Observable<T> = this.committedSubject.asObservable();

    abstract readonly _doUpdate: (id: string, patch: TPatch) => Promise<T>;

    sendCommitted(source: Observable<T>): Subscription {
        return source.subscribe((committed) => {
            // console.log('sending committed', this,committed)
            this.committedSubject.next(committed)
        });
    }

    async commit(patch: TPatch): Promise<T> {
        const current = await firstValueFrom(this.committed$);

        const committed = await this._doUpdate(current.id, patch);
        this.committedSubject.next(committed);
        return committed;
    }
}
