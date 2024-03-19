import {
  HttpErrorResponse,
  HttpParams,
  HttpStatusCode
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Observable,
  catchError,
  firstValueFrom,
  map,
  tap
} from 'rxjs';
import { ResearchPlan, researchPlanFromJsonObject } from 'src/app/research/plan/research-plan';
import { Campus, CampusLookup, CampusService, campusFromJsonObject } from 'src/app/uni/campus/campus';
import { Discipline, isDiscipline } from 'src/app/uni/discipline/discipline';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import {
  Model,
  ModelIndexPage,
  ModelParams,
  ModelQuery,
  modelIndexPageFromJsonObject,
  modelParamsFromJsonObject,
} from '../../common/model/model';
import { RestfulService } from '../../common/model/model-service';
import { Actor } from '../actor';
import { Role, roleFromJson } from './role';
import { Lab, labFromJsonObject } from 'src/app/lab/lab';
import parseISO from 'date-fns/parseISO';
import urlJoin from 'url-join';

export interface UserParams extends ModelParams {
  name: string;
  email: string;
  baseCampus: Campus | string;
  disciplines: readonly Discipline[];

  roles: ReadonlySet<Role>;
}

export class User extends Model implements UserParams {
  readonly email: string;
  readonly name: string;

  get baseCampus(): Campus | string {
    return this._baseCampus;
  }
  _baseCampus: Campus | string;
  // readonly discipline: Discipline;
  readonly roles: ReadonlySet<Role>;

  readonly disciplines: readonly Discipline[];
  /**
   * The labs that the current user supervises
   */
  constructor(params: UserParams) {
    super(params);
    this._baseCampus = params.baseCampus;
    // this.discipline = params.discipline;
    this.email = params.email;
    this.name = params.name;

    this.roles = params.roles;
    this.disciplines = params.disciplines;
  }

  async resolveBaseCampus(campusService: CampusService): Promise<Campus> {
    if (typeof this._baseCampus === 'string') {
      this._baseCampus = await firstValueFrom(campusService.fetch(this._baseCampus));
    }
    return this._baseCampus;
  }

  canActAs(actor: Actor) {
    return this.roles.has(actor.role);
  }

  get primaryDiscipline(): Discipline | null {
    return this.disciplines[ 0 ] || null;

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

  let baseCampus: Campus | string;
  if (typeof json[ 'baseCampus' ] === 'string') {
    baseCampus = json[ 'baseCampus' ];
  } else if (isJsonObject(json[ 'baseCampus' ])) {
    baseCampus = campusFromJsonObject(json[ 'baseCampus' ]);
  } else {
    throw new Error("Expected a json object 'baseCampus'");
  }

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
  const disciplines = json[ 'disciplines' ];

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
function userLookupId(lookup: string | UserLookup): string | undefined {
  if (typeof lookup === 'string') {
    return lookup;
  }
  return lookup?.id || undefined;
}
function userLookupEmail(lookup: string | UserLookup): string | undefined {
  if (typeof lookup === 'string') {
    return undefined;
  }
  return lookup.email;
}

export interface UserQuery extends ModelQuery<User> {
  includeRoles?: string[];
  discipline?: Discipline;
  search?: string;
  email?: string;
}

export function userQueryToHttpParams(query: UserQuery): HttpParams {
  let params = new HttpParams();
  if (query.includeRoles) {
    params = params.set('include_roles', query.includeRoles.join(','));
  }
  if (query.search) {
    params = params.set('search', query.search);
  }
  if (query.discipline) {
    params = params.set('discipline', query.discipline);
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
  if (typeof json[ 'tokenExpired' ] !== 'boolean') {
    throw new Error("Expected a boolean 'tokenExpired'")
  }
  if (typeof json[ 'tokenConsumedAt' ] !== 'string' && json[ 'tokenConsumedAt' ] !== null) {
    throw new Error("Expected a string or null 'tokenConsumedAt'");
  }
  if (typeof json[ 'tokenConsumed' ] !== 'boolean') {
    throw new Error("Expected a boolean 'tokenConsumed'");
  }

  return new TemporaryAccessUser({
    ...userParams,
    tokenExpiresAt: parseISO(json[ 'tokenExpiresAt' ]),
    tokenIsExpired: json[ 'tokenExpired' ],
    tokenConsumedAt: json[ 'tokenConsumedAt' ] ? parseISO(json[ 'tokenConsumedAt' ]) : null,
    tokenIsConsumed: json[ 'tokenConsumed' ]
  });
}



export interface AlterPassword {
  currentValue: string | undefined;
  newValue: string;
}

export class AlterPasswordError extends Error { }

export interface CreateTemporaryUserRequest {
  name: string;
  email: string;
  baseCampus: CampusLookup | string;
  discipline: Discipline;
}

function createTemporaryUserRequestToJsonObject(request: CreateTemporaryUserRequest): JsonObject {
  return {}
}

export interface CreateTemporaryUserResult {
  token: string;
  tokenExpiresAt: Date;
  user: User;
}

function createTemporaryUserResultFromJsonObject(json: JsonObject): CreateTemporaryUserResult {
  if (typeof json[ 'token' ] !== 'string') {
    throw new Error("Expected a string 'token'");
  }
  if (typeof json[ 'tokenExpiresAt' ] !== 'string') {
    throw new Error("Expected a string 'tokenExpiresAt'")
  }
  if (!isJsonObject(json[ 'user' ])) {
    throw new Error("Expected a json object 'user'");
  }
  return {
    token: json[ 'token' ],
    tokenExpiresAt: parseISO(json[ 'tokenExpiresAt' ]),
    user: userFromJsonObject(json[ 'user' ])
  };
}

export interface FinalizeTemporaryUserRequest {
  id: string;
  token: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class UserService extends RestfulService<User, UserQuery> {
  override readonly path: string = '/users';

  override readonly modelFromJsonObject = userFromJsonObject;
  override readonly modelQueryToHttpParams = userQueryToHttpParams;
  override createToJsonObject = undefined;
  override actionToJsonObject = undefined;

  me(): Observable<CurrentUser> {
    return this._httpClient
      .get<JsonObject>(this.indexMethodUrl('me'))
      .pipe(map((result) => currentUserFromJsonObject(result)));
  }

  lookup(lookup: UserLookup | string): Observable<User | null> {
    const id = userLookupId(lookup);
    if (id) {
      return this.fetch(id);
    }
    return this.queryOne({ email: userLookupEmail(lookup) });
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

  fetchTemporaryUser(id: string, accessToken: string): Observable<TemporaryAccessUser> {
    return this._httpClient
      .get<JsonObject>(
        urlJoin(this.indexMethodUrl('finalize-temporary-user'), id),
        { params: { token: accessToken } }
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
