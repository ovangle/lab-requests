import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import {
  Model,
  ModelLookup,
  ModelMeta,
  ModelParams,
  ModelPatch,
  modelLookupToHttpParams,
  modelParamsFromJsonObject,
  modelPatchToJson,
} from '../../common/model/model';
import { Role, roleFromJson } from './role';
import {
  HttpErrorResponse,
  HttpParams,
  HttpStatusCode,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RestfulService } from '../../common/model/model-service';
import { ModelCollection } from '../../common/model/model-collection';
import {
  NEVER,
  Observable,
  Observer,
  Subject,
  catchError,
  firstValueFrom,
  map,
  of,
  tap,
  throwError,
} from 'rxjs';
import { Actor } from '../actor';
import { Lab, labFromJson } from 'src/app/lab/common/lab';
import {
  ExperimentalPlan,
  experimentalPlanFromJson,
} from 'src/app/lab/experimental-plan/common/experimental-plan';
import { RIGHT_ARROW } from '@angular/cdk/keycodes';

export interface UserParams extends ModelParams {
  name: string;
  email: string;

  roles: ReadonlySet<Role>;
  labs: ReadonlyArray<Lab>;

  activePlans: ReadonlyArray<ExperimentalPlan>;
}

export class User extends Model implements UserParams {
  readonly email: string;
  readonly name: string;
  readonly roles: ReadonlySet<Role>;

  /**
   * The labs that the current user supervises
   */
  readonly labs: readonly Lab[];

  readonly activePlans: readonly ExperimentalPlan[];

  constructor(params: UserParams) {
    super(params);
    this.email = params.email;
    this.name = params.name;

    this.roles = params.roles;
    this.labs = params.labs;
    this.activePlans = params.activePlans;
  }

  canActAs(actor: Actor) {
    return this.roles.has(actor.role);
  }
}

function userParamsFromJson(json: unknown): UserParams {
  if (!isJsonObject(json)) {
    throw new Error('Not a json object');
  }
  const baseParams = modelParamsFromJsonObject(json);
  if (typeof json['email'] !== 'string') {
    throw new Error("Expected a string 'email'");
  }

  if (typeof json['name'] !== 'string') {
    throw new Error("Expected a string 'name'");
  }

  let roles: ReadonlySet<Role> = new Set();
  if (Array.isArray(json['roles'])) {
    roles = new Set(json['roles'].map(roleFromJson));
  }
  let labs: ReadonlyArray<Lab> = [];
  if (Array.isArray(json['labs'])) {
    labs = json['labs'].map(labFromJson);
  }
  let activePlans: ReadonlyArray<ExperimentalPlan> = [];
  if (Array.isArray(json['activePlans'])) {
    activePlans = json['activePlans'].map(experimentalPlanFromJson);
  }
  return {
    ...baseParams,
    name: json['name'],
    email: json['email'],
    roles,
    labs,
    activePlans,
  };
}

export function userFromJson(json: unknown) {
  return new User(userParamsFromJson(json));
}

export interface UserPatch extends ModelPatch<User> {}

function userPatchToJson(patch: UserPatch) {
  return modelPatchToJson(patch);
}

export interface UserLookup extends ModelLookup<User> {}

function userLookupToHttpParams(lookup: Partial<UserLookup>): HttpParams {
  return modelLookupToHttpParams(lookup);
}

export interface AlterPassword {
  currentValue: string;
  newValue: string;
}

export class AlterPasswordError extends Error {}

@Injectable({ providedIn: 'root' })
export class UserMeta extends ModelMeta<User, UserPatch, UserLookup> {
  readonly model = User;
  readonly modelParamsFromJson = userParamsFromJson;
  readonly modelPatchToJson = userPatchToJson;
  readonly lookupToHttpParams = userLookupToHttpParams;
}

@Injectable({ providedIn: 'root' })
export class UserService extends RestfulService<User, UserPatch, UserLookup> {
  override readonly metadata = inject(UserMeta);
  override readonly path = '/users';

  me(): Observable<User> {
    return this._httpClient
      .get<JsonObject>(this.indexMethodUrl('me'))
      .pipe(map((result) => this.modelFromJson(result)));
  }

  alterPassword(alterPasswordRequest: AlterPassword): Observable<User> {
    return this._httpClient
      .post<JsonObject>(
        this.indexMethodUrl('alter-password'),
        alterPasswordRequest,
      )
      .pipe(
        map((result) => this.modelFromJson(result)),
        catchError((err) => {
          if (
            err instanceof HttpErrorResponse &&
            err.status === HttpStatusCode.Conflict
          ) {
            throw new AlterPasswordError('Invalid current value');
          }
          throw err;
        }),
      );
  }
}

@Injectable({ providedIn: 'root' })
export class UserCollection extends ModelCollection<User, UserPatch> {
  private _activeUserId: string | null = null;

  constructor(service: UserService) {
    super(service);
  }

  async me(fetch = false): Promise<User> {
    if (fetch && this._activeUserId != null) {
      const me = await this.get(this._activeUserId);
    }
    return firstValueFrom(
      (this.service as UserService).me().pipe(
        this._cacheResult,
        tap((result) => {
          this._activeUserId = result.id;
        }),
      ),
    );
  }
}
