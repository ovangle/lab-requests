import {
  HttpErrorResponse,
  HttpStatusCode
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Observable,
  catchError,
  map,
  tap
} from 'rxjs';
import { ResearchPlan, researchPlanFromJsonObject } from 'src/app/research/plan/common/research-plan';
import { Campus, campusFromJsonObject } from 'src/app/uni/campus/common/campus';
import { Discipline, isDiscipline } from 'src/app/uni/discipline/discipline';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import {
  Model,
  ModelIndexPage,
  ModelParams,
  ModelPatch,
  modelIndexPageFromJsonObject,
  modelParamsFromJsonObject,
} from '../../common/model/model';
import {
  ModelCollection,
  injectModelService,
} from '../../common/model/model-collection';
import { RestfulService } from '../../common/model/model-service';
import { Actor } from '../actor';
import { Role, roleFromJson } from './role';
import { Lab, labFromJsonObject } from 'src/app/lab/lab';

export interface UserParams extends ModelParams {
  name: string;
  email: string;
  baseCampus: Campus;
  disciplines: ReadonlySet<Discipline>;

  roles: ReadonlySet<Role>;
}

export class User extends Model implements UserParams {
  readonly email: string;
  readonly name: string;

  readonly baseCampus: Campus;
  // readonly discipline: Discipline;
  readonly roles: ReadonlySet<Role>;

  readonly disciplines: ReadonlySet<Discipline>;
  /**
   * The labs that the current user supervises
   */
  constructor(params: UserParams) {
    super(params);
    this.baseCampus = params.baseCampus;
    // this.discipline = params.discipline;
    this.email = params.email;
    this.name = params.name;

    this.roles = params.roles;
    this.disciplines = params.disciplines;
  }

  canActAs(actor: Actor) {
    return this.roles.has(actor.role);
  }
}

function userParamsFromJsonObject(json: JsonObject): UserParams {
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

  // if (!isDiscipline(json[ 'discipline' ])) {
  //   throw new Error('Expected a valid discipline');
  // }

  let roles: ReadonlySet<Role> = new Set();
  if (Array.isArray(json['roles'])) {
    roles = new Set(json['roles'].map(roleFromJson));
  }

  if (!Array.isArray(json['disciplines']) || !json['disciplines'].every(isDiscipline)) {
    throw new Error("Expected an array of Disciplines 'disciplines'")
  }
  const disciplines = new Set(json['disciplines']);

  return {
    ...baseParams,
    name: json['name'],
    email: json['email'],
    baseCampus,

    roles,
    disciplines,
  };
}

export function userFromJsonObject(json: JsonObject): User {
  return new User(userParamsFromJsonObject(json));
}

interface CurrentUserParams extends UserParams {
  readonly labs: ModelIndexPage<Lab>;
  readonly plans: ModelIndexPage<ResearchPlan>;
}

export class CurrentUser extends User implements CurrentUserParams {
  readonly labs: ModelIndexPage<Lab>;
  readonly plans: ModelIndexPage<ResearchPlan>;

  constructor(params: CurrentUserParams) {
    super(params);
    this.labs = params.labs;
    this.plans = params.plans;
  }
}

function currentUserFromJsonObject(json: JsonObject): CurrentUser {
  const userParams = userParamsFromJsonObject(json);

  if (!isJsonObject(json['labs'])) {
    throw new Error("Expected a json object 'labs'")
  }
  const labs = modelIndexPageFromJsonObject(labFromJsonObject, json['labs']);

  if (!isJsonObject(json['plans'])) {
    throw new Error("Expected a json object 'plans'");
  }
  const plans = modelIndexPageFromJsonObject(researchPlanFromJsonObject, json['plans']);

  return new CurrentUser({
    ...userParams,
    labs,
    plans
  });
}

export interface UserPatch extends ModelPatch<User> { }

function userPatchToJson(patch: UserPatch) {
  return {};
}

export interface AlterPassword {
  currentValue: string;
  newValue: string;
}

export class AlterPasswordError extends Error { }

@Injectable({ providedIn: 'root' })
export class UserService extends RestfulService<User> {
  override readonly model = User;
  override readonly path: string = '/users';

  override readonly modelFromJsonObject = userFromJsonObject;
  override readonly modelPatchToJsonObject = userPatchToJson;

  me(): Observable<CurrentUser> {
    return this._httpClient
      .get<JsonObject>(this.indexMethodUrl('me'))
      .pipe(map((result) => currentUserFromJsonObject(result)));
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
export class UserCollection extends ModelCollection<User, UserService> implements UserService {
  private _currentUserId: string | null = null;

  protected _cacheCurrentUser(user: CurrentUser) {
    this._currentUserId = user.id;
    this._cache.set(user.id, user);
  }

  constructor(service: UserService) {
    super(service);
  }
  get _userService() {
    return this.service as UserService;
  }

  alterPassword(alterPasswordRequest: AlterPassword): Observable<User> {
    return this._userService.alterPassword(alterPasswordRequest);
  }

  me(): Observable<CurrentUser> {
    if (this._currentUserId != null) {
      return this.fetch(this._currentUserId) as Observable<CurrentUser>;
    }
    return (this.service as UserService).me().pipe(
      tap((result) => {
        this._cacheCurrentUser(result)
      }),
    );
  }
}

export function injectUserService(): UserService {
  return injectModelService(UserService, UserCollection);
}
