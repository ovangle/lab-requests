import {
  HttpErrorResponse,
  HttpParams,
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
import { Campus, CampusLookup, campusFromJsonObject } from 'src/app/uni/campus/common/campus';
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
import parseISO from 'date-fns/parseISO';
import urlJoin from 'url-join';

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
  if (typeof json[ 'email' ] !== 'string') {
    throw new Error("Expected a string 'email'");
  }

  if (typeof json[ 'name' ] !== 'string') {
    throw new Error("Expected a string 'name'");
  }

  if (!isJsonObject(json[ 'baseCampus' ])) {
    throw new Error("Expected a json object 'baseCampus'");
  }
  const baseCampus = campusFromJsonObject(json[ 'baseCampus' ]);

  // if (!isDiscipline(json[ 'discipline' ])) {
  //   throw new Error('Expected a valid discipline');
  // }

  let roles: ReadonlySet<Role> = new Set();
  if (Array.isArray(json[ 'roles' ])) {
    roles = new Set(json[ 'roles' ].map(roleFromJson));
  }

  if (!Array.isArray(json[ 'disciplines' ]) || !json[ 'disciplines' ].every(isDiscipline)) {
    throw new Error("Expected an array of Disciplines 'disciplines'")
  }
  const disciplines = new Set(json[ 'disciplines' ]);

  return {
    ...baseParams,
    name: json[ 'name' ],
    email: json[ 'email' ],
    baseCampus,

    roles,
    disciplines,
  };
}

export function userFromJsonObject(json: JsonObject): User {
  return new User(userParamsFromJsonObject(json));
}

export interface UserLookup {
  id?: string;
  email?: string;
}

function userLookupToHttpParams(lookup: UserLookup): HttpParams {
  let params = new HttpParams();
  if (lookup.id) {
    params = params.set('id', lookup.id);
  }
  if (lookup.email) {
    params = params.set('email', lookup.email);
  }
  return params;
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

  if (!isJsonObject(json[ 'labs' ])) {
    throw new Error("Expected a json object 'labs'")
  }
  const labs = modelIndexPageFromJsonObject(labFromJsonObject, json[ 'labs' ]);

  if (!isJsonObject(json[ 'plans' ])) {
    throw new Error("Expected a json object 'plans'");
  }
  const plans = modelIndexPageFromJsonObject(researchPlanFromJsonObject, json[ 'plans' ]);

  return new CurrentUser({
    ...userParams,
    labs,
    plans
  });
}


interface TemporaryAccessUserParams extends UserParams {
  tokenExpiresAt: Date;
  tokenIsExpired: boolean;
  tokenConsumedAt: Date | null;
  tokenIsConsumed: boolean;
}

export class TemporaryAccessUser extends User implements TemporaryAccessUserParams {
  tokenExpiresAt: Date;
  tokenIsExpired: boolean;
  tokenConsumedAt: Date | null;
  tokenIsConsumed: boolean;

  constructor(params: TemporaryAccessUserParams) {
    super(params);
    this.tokenExpiresAt = params.tokenExpiresAt;
    this.tokenIsExpired = params.tokenIsExpired;
    this.tokenConsumedAt = params.tokenConsumedAt;
    this.tokenIsConsumed = params.tokenIsConsumed;
  }
}

function temporaryAccessUserFromJsonObject(json: JsonObject) {
  const userParams = userParamsFromJsonObject(json);

  if (typeof json[ 'tokenExpiresAt' ] !== 'string') {
    throw new Error("Expected a string 'tokenExpiresAt'")
  }
  if (typeof json[ 'tokenIsExpired' ] !== 'boolean') {
    throw new Error("Expected a boolean 'tokenIsExpired'")
  }
  if (typeof json[ 'tokenConsumedAt' ] !== 'string' && json[ 'tokenConsumedAt' ] !== null) {
    throw new Error("Expected a string or null 'tokenConsumedAt'");
  }
  if (typeof json[ 'tokenIsConsumed' ] !== 'boolean') {
    throw new Error("Expected a boolean 'tokenIsConsumed'");
  }

  return new TemporaryAccessUser({
    ...userParams,
    tokenExpiresAt: parseISO(json[ 'tokenExpiresAt' ]),
    tokenIsExpired: json[ 'tokenIsExpired' ],
    tokenConsumedAt: json[ 'tokenConsumedAt' ] ? parseISO(json[ 'tokenConsumedAt' ]) : null,
    tokenIsConsumed: json[ 'tokenIsConsumed' ]
  });
}



export interface AlterPassword {
  currentValue: string;
  newValue: string;
}

export class AlterPasswordError extends Error { }

export interface CreateTemporaryUserRequest {
  name: string;
  email: string;
  baseCampus: CampusLookup | string;
  discipline: Discipline;
}

export interface CreateTemporaryUserResult {
  token: string;
  user: User;
}

function createTemporaryUserResultFromJsonObject(json: JsonObject): CreateTemporaryUserResult {
  if (typeof json[ 'token' ] !== 'string') {
    throw new Error("Expected a string 'token'");
  }
  if (!isJsonObject(json[ 'user' ])) {
    throw new Error("Expected a json object 'user'");
  }
  return {
    token: json[ 'token' ],
    user: userFromJsonObject(json[ 'user' ])
  };
}

export interface FinalizeTemporaryUserRequest {
  id: string;
  token: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class UserService extends RestfulService<User> {
  override readonly model = User;
  override readonly path: string = '/users';

  override readonly modelFromJsonObject = userFromJsonObject;

  me(): Observable<CurrentUser> {
    return this._httpClient
      .get<JsonObject>(this.indexMethodUrl('me'))
      .pipe(map((result) => currentUserFromJsonObject(result)));
  }

  lookup(lookup: UserLookup | string): Observable<User | null> {
    if (typeof lookup === 'string') {
      return this.fetch(lookup);
    }
    return this.queryOne(userLookupToHttpParams(lookup));
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

  createTemporaryUser(request: CreateTemporaryUserRequest) {
    return this._httpClient
      .post<JsonObject>(
        this.indexMethodUrl('create-temporary-user'),
        request
      ).pipe(
        map((result) => createTemporaryUserResultFromJsonObject(result))
      );
  }

  fetchTemporaryUser(id: string): Observable<TemporaryAccessUser> {
    return this._httpClient
      .get<JsonObject>(
        urlJoin(this.indexMethodUrl('finalize-temporary-user'), id)
      ).pipe(
        map((result) => temporaryAccessUserFromJsonObject(result))
      );
  }

  finalizeTemporaryUser(request: FinalizeTemporaryUserRequest) {
    return this._httpClient
      .post<JsonObject>(
        this.indexMethodUrl('finalize-temporary-user'),
        request
      ).pipe(
        map((result) => this.modelFromJsonObject(result))
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

  lookup(lookup: string | UserLookup) {
    return this.service.lookup(lookup).pipe(
      this._maybeCacheResult
    );
  }

  createTemporaryUser(request: CreateTemporaryUserRequest) {
    return this.service.createTemporaryUser(request).pipe(
      tap(result => {
        this._cache.set(result.user.id, result.user);
      })
    )
  }

  fetchTemporaryUser(id: string) {
    return this.service.fetchTemporaryUser(id);
  }

  finalizeTemporaryUser(request: FinalizeTemporaryUserRequest): Observable<User> {
    return this.service.finalizeTemporaryUser(request).pipe(
      this._cacheResult
    )
  }
}

export function injectUserService(): UserService {
  return injectModelService(UserService, UserCollection);
}
