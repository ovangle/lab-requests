import {
  DestroyRef,
  Inject,
  Injectable,
  InjectionToken,
  Optional,
  Provider,
  Type,
  inject,
} from '@angular/core';
import { Model, ModelIndexPage, ModelParams, ModelPatch } from './model';
import {
  Connectable,
  Observable,
  ReplaySubject,
  Subscription,
  connectable,
  defer,
  first,
  firstValueFrom,
  map,
  shareReplay,
  switchMap,
} from 'rxjs';
import { ModelService } from './model-service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { JsonObject } from 'src/app/utils/is-json-object';
import urlJoin from 'url-join';

@Injectable()
export abstract class ModelContext<
  T extends Model
> {
  abstract readonly service: ModelService<T>;

  readonly committedSubject = new ReplaySubject<T>(1);
  readonly committed$: Observable<T> = this.committedSubject.asObservable();
  readonly url$ = this.committed$.pipe(
    switchMap(committed => this.service.modelUrl(committed)),
    shareReplay(1)
  );

  nextCommitted(value: T) {
    this.committedSubject.next(value);
  }

  sendCommittedId(source: Observable<string>): Subscription {
    return this.sendCommitted(
      source.pipe(switchMap(id => this.service.fetch(id)))
    );
  }

  sendCommitted(source: Observable<T>): Subscription {
    return source.subscribe((committed) => {
      // console.log('sending committed', this,committed)
      this.committedSubject.next(committed);
    });
  }

  /*
  async commit(updateRequest: TUpdate): Promise<T> {
    const current = await firstValueFrom(this.committed$);

    const committed = await this._doUpdate(current.id, updateRequest);
    this.committedSubject.next(committed);
    return committed;
  }
  */
}

@Injectable()
export abstract class RelatedModelService<TContextModel extends Model, T extends Model> extends ModelService<T> {
  abstract readonly context: ModelContext<TContextModel>;

  get indexUrl$(): Observable<string> {
    return this.context.url$.pipe(first());
  }

  resourceUrl(id: string) {
    return this.indexUrl$.pipe(
      map(indexUrl => urlJoin(indexUrl, id) + '/')
    );
  }

  override modelUrl(model: T): Observable<string> {
    return this.resourceUrl(model.id);
  }

  protected override _doFetch(id: string): Observable<JsonObject> {
    return this.resourceUrl(id).pipe(
      switchMap(resourceUrl => this._httpClient.get<JsonObject>(resourceUrl)),
    );
  }

  protected override _doQueryPage(params: HttpParams | { [k: string]: string | number | boolean | string[]; }): Observable<JsonObject> {
    return this.indexUrl$.pipe(
      switchMap(indexUrl => this._httpClient.get<JsonObject>(indexUrl, { params })),
    );
  }
}