import { DestroyRef, Injectable, Type, inject } from '@angular/core';
import {
  Observable,
  ReplaySubject,
  debounceTime,
  defer,
  filter,
  firstValueFrom,
  map,
  shareReplay,
  skipWhile,
  switchMap,
  tap,
} from 'rxjs';
import {
  Model,
  ModelLookup,
  ModelMeta,
  ModelPatch,
  ModelResponsePage,
} from './model';
import { ModelService } from './model-service';

export interface ModelQuery<
  T extends Model,
  TLookup extends ModelLookup<T> = ModelLookup<T>,
> {
  readonly model: Type<T>;

  setLookup(lookup: Partial<TLookup>): Promise<ModelResponsePage<T, TLookup>>;
  loadNextPage(): Promise<ModelResponsePage<T, TLookup>>;

  readonly page$: Observable<ModelResponsePage<T>>;
  readonly pageItems$: Observable<T[]>;
  readonly totalItemCount$: Observable<number>;
}

@Injectable()
export class ModelCollection<
  T extends Model,
  TPatch extends ModelPatch<T> = ModelPatch<T>,
  TLookup extends ModelLookup<T> = ModelLookup<T>,
> implements ModelQuery<T, TLookup>
{
  get metadata(): ModelMeta<T, TPatch, TLookup> {
    return this.service.metadata;
  }

  get model() {
    return this.service.model;
  }

  readonly lookupSubject = new ReplaySubject<Partial<TLookup>>(1);

  readonly _cache = new Map<string, T>();
  protected _cacheResult = tap((value: T) => this._cache.set(value.id, value));
  protected _cacheResultPage = tap((page: ModelResponsePage<T, TLookup>) => {
    page.items.forEach((item) => this._cache.set(item.id, item));
  });

  readonly page$: Observable<ModelResponsePage<T, TLookup>> =
    this.lookupSubject.pipe(
      debounceTime(300),
      switchMap((lookup) => this.service.queryPage(lookup)),
      this._cacheResultPage,
      shareReplay(1),
    );

  readonly pageItems$ = defer(() => this.page$.pipe(map((page) => page.items)));
  readonly totalItemCount$ = defer(() =>
    this.page$.pipe(map((page) => page.totalItemCount)),
  );

  constructor(readonly service: ModelService<T, TPatch, TLookup>) {
    const destroyRef = inject(DestroyRef, { optional: true });
    const keepalivePage = this.page$.subscribe();

    if (destroyRef) {
      destroyRef.onDestroy(() => {
        this.lookupSubject.complete();
        this._cache.clear();
        keepalivePage.unsubscribe();
      });
    }
  }

  setLookup(lookup: Partial<TLookup>): Promise<ModelResponsePage<T, TLookup>> {
    this.lookupSubject.next(lookup);
    return firstValueFrom(this.page$.pipe(filter((p) => p.lookup === lookup)));
  }

  async loadNextPage() {
    const page = await firstValueFrom(this.page$);
    const nextPageId = page.next ? Number.parseInt(page.next) : 1;
    this.lookupSubject.next({
      ...page.lookup,
      pageId: nextPageId,
    });
    return firstValueFrom(
      this.page$.pipe(
        skipWhile((currPage) => currPage.lookup.pageId !== nextPageId),
      ),
    );
  }

  get(id: string): Promise<T> {
    if (this._cache.has(id)) {
      return Promise.resolve(this._cache.get(id)!);
    }
    return firstValueFrom(this.service.fetch(id).pipe(this._cacheResult));
  }

  add(patch: TPatch): Promise<T> {
    return firstValueFrom(this.service.create(patch).pipe(this._cacheResult));
  }

  update(id: string, patch: TPatch) {
    return firstValueFrom(
      this.service.update(id, patch).pipe(this._cacheResult),
    );
  }
}

export function injectModelQuery<
  T extends Model,
  TLookup extends ModelLookup<T> = ModelLookup<T>,
>(
  serviceType: Type<ModelService<T, any, TLookup>>,
  collectionType: Type<ModelCollection<T, any, TLookup>>,
): ModelQuery<T, TLookup> {
  const service = inject(serviceType);
  const collection = inject(collectionType, { optional: true });

  if (collection) {
    return collection;
  } else {
    return new ModelCollection(service);
  }
}

export function injectModelAdd<
  T extends Model,
  TPatch extends ModelPatch<T> = ModelPatch<T>,
>(
  serviceType: Type<ModelService<T, TPatch>>,
  collectionType: Type<ModelCollection<T, TPatch>>,
): (patch: TPatch) => Promise<T> {
  const service = inject(serviceType);
  const collection = inject(collectionType, { optional: true });

  return (patch: TPatch) => {
    if (collection) {
      return collection.add(patch);
    } else {
      return firstValueFrom(service.create(patch));
    }
  };
}

export function injectModelUpdate<
  T extends Model,
  TPatch extends ModelPatch<T> = ModelPatch<T>,
>(
  serviceType: Type<ModelService<T, TPatch>>,
  collectionType: Type<ModelCollection<T, TPatch>>,
) {
  const service = inject(serviceType);
  const collection = inject(collectionType, { optional: true });

  return (id: string, patch: TPatch) => {
    if (collection) {
      return collection.update(id, patch);
    } else {
      return firstValueFrom(service.update(id, patch));
    }
  };
}

export function injectCachedModelFetch<T extends Model>(
  serviceType: Type<ModelService<T>>,
  collectionType: Type<ModelCollection<T>>,
): (id: string) => Promise<T> {
  const service = inject(serviceType);
  const collection = inject(collectionType);

  return (id: string) => {
    if (collection) {
      return collection.get(id);
    } else {
      return firstValueFrom(service.fetch(id));
    }
  };
}
