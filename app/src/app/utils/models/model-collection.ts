
import { Injectable, Provider, Type, inject } from '@angular/core';
import {Lookup, ModelService, Page} from './model-service';
import { BehaviorSubject, Observable, ReplaySubject, Subscription, combineLatest, connectable, defer, distinctUntilChanged, map, shareReplay, switchMap, tap } from 'rxjs';
import { Context } from './model-context';

export interface Model {
    readonly id: string;
}


export abstract class ModelCollection<T extends Model, TLookup extends Lookup<T> = Lookup<T>> {
    abstract readonly models: ModelService<T, unknown, unknown>;

    // Optionally, a path to the collection to use instead
    // of the model service default.
    readonly resourcePath?: string = undefined;

    readonly querySubject = new BehaviorSubject<Partial<TLookup>>({});
    readonly query$ = this.querySubject.asObservable();

    readonly resultPage$ = this.querySubject.pipe(
        switchMap(lookup => this.models.queryPage(lookup, {resourcePath: this.resourcePath})),
        shareReplay(1)
    );

    readonly count$ = defer(() => this.resultPage$.pipe(map(page => page.totalItemCount)));
    readonly items$ = defer(() => this.resultPage$.pipe(map(page => page.items)));

    connectQuery(query$: Observable<Partial<TLookup>>): Subscription {
        return query$.subscribe((value) => this.querySubject.next(value));
    }

    readonly focusIdSubject = new BehaviorSubject<string | null>(null);
    readonly focused$: Observable<T | null> = combineLatest([
        this.resultPage$,
        this.focusIdSubject
    ]).pipe(
        map(([page, focusId])=> {
            if (focusId == null) {
                return null;
            }
            const item = page.items.find(item => item.id === focusId);
            return item || null;
        }),
        // If the page does not contain the focused item, 
        // reset the focus id.
        tap((item) => {
            const focusId = this.focusIdSubject.value;
            if (item == null && focusId != null) {
                this.focusIdSubject.next(null);
            }
        }),
        // The tap will duplicate `null` values
        distinctUntilChanged(),
        shareReplay(1)
    );
}

@Injectable()
export class FocusedModelContext<TModel extends { readonly id: string}, TPatch, TCreate extends TPatch = TPatch> extends Context<TModel, TPatch, TCreate> {
    override readonly models: ModelService<TModel, unknown, unknown>;

    constructor(
        readonly collection: ModelCollection<TModel>,
    ) {
        super();
        this.models = collection.models;
    }

    override _doCreate(request: TCreate): Observable<TModel> {
        return this.models.create(request, {resourcePath: this.collection.resourcePath});
    }

    override _doCommit(identifier: string, patch: TPatch): Observable<TModel> {
        return this.models.update(identifier, patch);
    }

}

export function provideFocusedModelContext<
        TModel extends { readonly id: string }, 
>(
    collectionCls: Type<ModelCollection<TModel>>,
    contextCls: Type<Context<TModel>>, 
): Provider[] {
    return [
        {
            provide: contextCls,
            useFactory: (collection: ModelCollection<TModel>) => {
                const context = new FocusedModelContext(collection);
                return new contextCls(context);
            },
            deps: [collectionCls]
        }
    ];

}
