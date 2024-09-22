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
import { Model, ModelQuery, ModelRef } from './model';
import {
  BehaviorSubject,
  Connectable,
  NEVER,
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
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { ModelService } from './model-service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { JsonObject } from 'src/app/utils/is-json-object';
import urlJoin from 'url-join';
import { TemplateBindingParseResult } from '@angular/compiler';
import { ActivatedRoute, ParamMap } from '@angular/router';

export interface ReadOnlyModelContext<T extends Model> {
  readonly committed$: Observable<T>;
}

export const MODEL_CONTEXT_SERVICE = new InjectionToken<ModelService<any>>('ROUTE_SERVICE');
export const MODEL_CONTEXT_SOURCE = new InjectionToken<Observable<any>>('MODEL_CONTEXT_SOURCE');


@Injectable()
export abstract class ModelContext<T extends Model, TService extends ModelService<T> = ModelService<T>> implements ReadOnlyModelContext<T> {
  readonly committedSubject = new ReplaySubject<T | null>(1);
  readonly mCommitted$ = this.committedSubject.asObservable();
  readonly committed$ = this.mCommitted$.pipe(
    filter((m): m is T => m != null)
  );

  readonly url$ = this.committed$.pipe(
    switchMap(committed => this.service.modelUrl(committed)),
    shareReplay(1)
  );

  constructor(
    @Inject(MODEL_CONTEXT_SERVICE) readonly service: TService,
    @Inject(MODEL_CONTEXT_SOURCE) source: Observable<T | null>) {
    source.subscribe(this.committedSubject);

    inject(DestroyRef).onDestroy(() => {
      this.committedSubject.complete();
    })
  }

  nextCommitted(value: ModelRef<T>) {
    if (typeof value === 'string') {
      this.service.fetch(value).subscribe((v) => this.committedSubject.next(v))
    } else {
      this.committedSubject.next(value);
    }
  }

  async refresh(): Promise<void> {
    const refreshed = await firstValueFrom(this.committed$.pipe(
      first(),
      switchMap(committed => this.service.fetch(committed, { useCache: false })),
    ));
    this.committedSubject.next(refreshed);
  }
}

export interface ModelContextType<T extends Model, TService extends ModelService<T>> {
  new(service: TService, source: Observable<T | null>): ModelContext<T, TService>;
}

export function provideModelContextFromRoute<T extends Model, TService extends ModelService<T>>(
  serviceType: Type<TService>,
  contextType: ModelContextType<T, TService>,
  param: string,
  isOptionalParam: boolean
): Provider {
  return {
    provide: contextType,
    useFactory: (service: TService, route: ActivatedRoute) => {
      const source = route.paramMap.pipe(
        map(paramMap => {
          const id = paramMap.get(param)
          if (id == null && !isOptionalParam) {
            throw new Error(`Expected :${param} in activated route params`);
          }
          return id;
        }),
        switchMap(ref => ref ? service.fetch(ref) : of(null))
      )

      return new contextType(service, source);
    },
    deps: [serviceType, ActivatedRoute]
  }
}