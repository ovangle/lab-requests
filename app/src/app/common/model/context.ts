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
import { Model, ModelParams, ModelPatch } from './model';
import {
  Connectable,
  Observable,
  ReplaySubject,
  Subscription,
  connectable,
  firstValueFrom,
} from 'rxjs';
import { ModelService } from './model-service';

@Injectable()
export abstract class ModelContext<
  T extends Model,
  TUpdate extends ModelPatch<T> = ModelPatch<T>,
> {
  readonly committedSubject = new ReplaySubject<T>(1);
  readonly committed$: Observable<T> = this.committedSubject.asObservable();

  abstract _doUpdate(id: string, patch: TUpdate): Promise<T>;

  nextCommitted(value: T) {
    this.committedSubject.next(value);
  }

  sendCommitted(source: Observable<T>): Subscription {
    return source.subscribe((committed) => {
      // console.log('sending committed', this,committed)
      this.committedSubject.next(committed);
    });
  }

  async commit(updateRequest: TUpdate): Promise<T> {
    const current = await firstValueFrom(this.committed$);

    const committed = await this._doUpdate(current.id, updateRequest);
    this.committedSubject.next(committed);
    return committed;
  }
}
