import { DestroyRef, Injectable, inject } from "@angular/core";
import { Model, ModelIndexPage, ModelQuery } from "./model";
import { ModelService } from "./model-service";
import { BehaviorSubject, Observable, ReplaySubject, connectable, defer, map, shareReplay, switchMap } from "rxjs";
import { ActivatedRoute, ParamMap } from "@angular/router";


@Injectable()
export abstract class ModelIndex<T extends Model, TQuery extends ModelQuery<T>> {
    abstract service: ModelService<T, TQuery>;

    readonly route = inject(ActivatedRoute);

    abstract _queryFromRouteParams(paramMap: ParamMap): Partial<TQuery>;

    protected _querySubject = new BehaviorSubject<Partial<TQuery>>({});
    readonly query$ = this._querySubject.asObservable();

    setQueryKey<K extends keyof TQuery>(key: K, value: TQuery[K]): void {
        const query = this._querySubject.value;
        this._querySubject.next({
            ...query,
            [key]: value
        });
    }

    clearQueryKey<K extends keyof TQuery>(key: K): TQuery[K] | undefined {
        const query = this._querySubject.value;
        const currentValue = query[key];
        if (currentValue !== undefined) {
            this._querySubject.next({
                ...query,
                [key]: undefined
            });
        }
        return currentValue || undefined;
    }

    patchQuery(query: Partial<TQuery>): void {
        this._querySubject.next({
            ...this._querySubject.value,
            ...query
        });
    }

    constructor() {
        const destroyRef = inject(DestroyRef);

        const _fromRouteParams = this.route.paramMap.pipe(
            map(paramMap => this._queryFromRouteParams(paramMap))
        ).subscribe((query) => this.patchQuery(query));

        destroyRef.onDestroy(() => {
            _fromRouteParams.unsubscribe();
            this._querySubject.complete();
        });
    }

    readonly page$ = this._querySubject.pipe(
        switchMap(query => this.service.queryPage(query)),
        shareReplay(1)
    );

    readonly pageItems$ = this.page$.pipe(
        map(page => page.items)
    );

    readonly totalItemCount$ = this.page$.pipe(
        map(page => page.totalItemCount)
    );

    readonly totalPageCount$ = this.page$.pipe(
        map(page => page.totalPageCount)
    )
}