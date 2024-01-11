import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import {
  Model,
  ModelParams,
  ModelPatch,
  modelParamsFromJsonObject,
} from '../../common/model/model';
import { Role, roleFromJson } from './role';
import {
  HttpErrorResponse,
  HttpParams,
  HttpStatusCode,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RestfulService } from '../../common/model/model-service';
import {
  ModelCollection,
  injectModelService,
} from '../../common/model/model-collection';
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
import { Campus, campusFromJsonObject } from 'src/app/uni/campus/common/campus';
import { Discipline, isDiscipline } from 'src/app/uni/discipline/discipline';

export interface UserParams extends ModelParams {
  name: string;
  email: string;
  baseCampus: Campus;
  discipline: Discipline;

  roles: ReadonlySet<Role>;
}

export class User extends Model implements UserParams {
  readonly email: string;
  readonly name: string;

  readonly baseCampus: Campus;
  readonly discipline: Discipline;
  readonly roles: ReadonlySet<Role>;

  /**
   * The labs that the current user supervises
   */
  constructor(params: UserParams) {
    super(params);
    this.email = params.email;
    this.name = params.name;

    this.roles = params.roles;
  }

  canActAs(actor: Actor) {
    return this.roles.has(actor.role);
  }
}

export function userFromJsonObject(json: JsonObject): User {
  const baseParams = modelParamsFromJsonObject(json);
  if (typeof json['email'] !== 'string') {
    throw new Error("Expected a string 'email'");
  }

  if (typeof json['name'] !== 'string') {
    throw new Error("Expected a string 'name'");
  }

  if (!isJsonObject(json['baseCampus'])) {
    throw new Error("Expected a json object 'baseCampus'");
  }
  const baseCampus = campusFromJsonObject(json['baseCampus']);

  if (!isDiscipline(json['discipline'])) {
    throw new Error('Expected a valid discipline');
  }

  let roles: ReadonlySet<Role> = new Set();
  if (Array.isArray(json['roles'])) {
    roles = new Set(json['roles'].map(roleFromJson));
  }

  return new User({
    ...baseParams,
    name: json['name'],
    email: json['email'],
    baseCampus,
    discipline: json['discipline'],

    roles,
  });
}

export interface UserPatch extends ModelPatch<User> {}

function userPatchToJson(patch: UserPatch) {
  return {};
}

export interface AlterPassword {
  currentValue: string;
  newValue: string;
}

export class AlterPasswordError extends Error {}

@Injectable({ providedIn: 'root' })
export class UserService extends RestfulService<User> {
  override readonly model = User;
  override readonly path: string = '/users';

  override readonly modelFromJsonObject = userFromJsonObject;
  override readonly modelPatchToJsonObject = userPatchToJson;

  me(): Observable<User> {
    return this._httpClient
      .get<JsonObject>(this.indexMethodUrl('me'))
      .pipe(map((result) => this.modelFromJsonObject(result)));
  }

  alterPassword(alterPasswordRequest: AlterPassword): Observable<User> {
    return this._httpClient
      .post<JsonObject>(
        this.indexMethodUrl('alter-password'),
        alterPasswordRequest,
      )
      .pipe(
        map((result) => this.modelFromJsonObject(result)),
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
export class UserCollection extends ModelCollection<User> {
  private _activeUserId: string | null = null;

  constructor(service: UserService) {
    super(service);
  }
  get _userService() {
    return this.service as UserService;
  }

  alterPassword(alterPasswordRequest: AlterPassword): Observable<User> {
    return this._userService.alterPassword(alterPasswordRequest);
  }

  me(): Observable<User> {
    if (this._activeUserId != null) {
      return this.fetch(this._activeUserId);
    }
    return (this.service as UserService).me().pipe(
      this._cacheResult,
      tap((result) => {
        this._activeUserId = result.id;
      }),
    );
  }
}

export function injectUserService(): UserService {
  return injectModelService(UserService, UserCollection);
}
