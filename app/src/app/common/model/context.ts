import {
  DestroyRef,
  Directive,
  EmbeddedViewRef,
  Inject,
  Injectable,
  InjectionToken,
  Injector,
  Optional,
  Provider,
  TemplateRef,
  Type,
  ViewContainerRef,
  ViewRef,
  inject,
} from '@angular/core';
import { Model, ModelCreateRequest, ModelIndexPage, ModelParams, ModelQuery } from './model';
import {
  BehaviorSubject,
  Connectable,
  Observable,
  ReplaySubject,
  Subscription,
  combineLatest,
  connectable,
  defer,
  filter,
  first,
  firstValueFrom,
  map,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { ModelService } from './model-service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { JsonObject } from 'src/app/utils/is-json-object';
import urlJoin from 'url-join';
import { TemplateBindingParseResult } from '@angular/compiler';

@Injectable()
export abstract class ModelContext<
  T extends Model
> {
  abstract readonly service: ModelService<T>;
  readonly _destroyRef = inject(DestroyRef, { optional: true });

  constructor() {
    if (this._destroyRef != null) {
      this._destroyRef.onDestroy(() => {
        this.committedSubject.complete()
      });
    }
  }

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
      source.pipe(switchMap(id => {
        console.log('fetching equipment', id);
        return this.service.fetch(id)
      }))
    );
  }

  sendCommitted(source: Observable<T>): Subscription {
    return source.subscribe((committed) => {
      // console.log('sending committed', this,committed)
      this.committedSubject.next(committed);
    });
  }

  async refresh(): Promise<void> {
    const refreshed = firstValueFrom(this.committed$.pipe(
      first(),
      switchMap(committed => this.service.fetch(committed.id, { useCache: false })),
      tap(refreshed => this.nextCommitted(refreshed))
    ));
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
export abstract class RelatedModelService<
  TContextModel extends Model,
  T extends Model,
  TQuery extends ModelQuery<T> = ModelQuery<T>,
> extends ModelService<T, TQuery> {
  abstract readonly context: ModelContext<TContextModel>;
  abstract path: string;

  get indexUrl$(): Observable<string> {
    return this.context.url$.pipe(
      first(),
      map(url => urlJoin(url, this.path) + '/')
    );
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

  protected override _doQueryPage(params: HttpParams): Observable<JsonObject> {
    return this.indexUrl$.pipe(
      switchMap(indexUrl => this._httpClient.get<JsonObject>(indexUrl, { params })),
    );
  }
}

@Directive()
export abstract class AbstractModelContextDirective<T extends Model> {

  protected readonly modelSubject = new BehaviorSubject<T | null>(null);
  readonly currentModel$ = this.modelSubject.asObservable();

  protected nextModel(model: T | null) {
    this.modelSubject.next(model);
  }

  protected readonly currentViewSubject = new BehaviorSubject<EmbeddedViewRef<unknown> | null>(null);
  readonly currentView$ = this.currentViewSubject.asObservable();

  constructor(readonly contextType: Type<ModelContext<T>>) {
    const context = new (contextType)();

    context.sendCommitted(
      this.currentModel$.pipe(filter((m): m is T => m != null))
    );

    const viewContainer = inject(ViewContainerRef);
    const templateRef = inject(TemplateRef<unknown>);

    const viewInjector = Injector.create({
      providers: [
        { provide: contextType, useValue: context }
      ],
      parent: inject(Injector)
    });

    combineLatest([
      this.modelSubject,
      this.currentViewSubject,
    ]).pipe(
      map(([model, currentView]) => {
        if (model != null && currentView == null) {
          currentView = viewContainer.createEmbeddedView(
            templateRef,
            { injector: viewInjector }
          );
        }
        if (model == null && currentView != null) {
          viewContainer.clear();
          currentView = null
        }
        return currentView;
      })
    ).subscribe(this.currentViewSubject);

    inject(DestroyRef).onDestroy(() => {
      this.modelSubject.complete();
      if (this.currentViewSubject.value) {
        viewContainer.clear();
      }
      this.currentViewSubject.complete();
    });
  }
} 