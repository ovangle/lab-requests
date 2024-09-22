import { HttpErrorResponse, HttpParams, HttpStatusCode } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  Observable,
  catchError,
  firstValueFrom,
  map,
  tap
} from 'rxjs';
import { ResearchPlan } from 'src/app/research/plan/research-plan';
import { Campus, CampusLookup, CampusService } from 'src/app/uni/campus/campus';
import { Discipline, isDiscipline } from 'src/app/uni/discipline/discipline';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import {
  Model,
  ModelFactory,
  ModelIndexPage,
  ModelQuery,
  ModelRef,
  modelIndexPageFromJsonObject,
  setModelQueryParams,
} from '../common/model/model';
import { ModelService, RestfulService } from '../common/model/model-service';
import { Actor } from './actor';
import { Role, roleFromJson } from './common/role';
import { Lab, LabService } from 'src/app/lab/lab';
import parseISO from 'date-fns/parseISO';
import urlJoin from 'url-join';
import { UserDomain } from './common/user-domain';


export class User extends Model {
  readonly email: string;
  readonly name: string;

  readonly roles: ReadonlySet<Role>;

  readonly baseCampus: ModelRef<Campus>;
  readonly primaryDiscipline: Discipline;
  readonly disciplines: readonly Discipline[];

  constructor(json: JsonObject) {
    super(json);
    if (typeof json['email'] !== 'string') {
      throw new Error("Expected a string 'email'");
    }
    this.email = json['email'];

    if (typeof json['name'] !== 'string') {
      throw new Error("Expected a string 'name'");
    }
    this.name = json['name'];

    if (typeof json['baseCampus'] === 'string') {
      this.baseCampus = json['baseCampus'];
    } else if (isJsonObject(json['baseCampus'])) {
      this.baseCampus = new Campus(json['baseCampus']);
    } else {
      throw new Error("Expected a json object 'baseCampus'");
    }

    let roles: ReadonlySet<Role> = new Set();
    if (Array.isArray(json['roles'])) {
      roles = new Set(json['roles'].map(roleFromJson));
    }
    this.roles = roles;

    if (!Array.isArray(json['disciplines']) || !json['disciplines'].every(isDiscipline)) {
      throw new Error("Expected an array of Disciplines 'disciplines'")
    }
    this.disciplines = json['disciplines'];

    if (!isDiscipline(json['primaryDiscipline'])) {
      throw new Error("Expected a discipline 'primaryDiscipline'")
    }
    this.primaryDiscipline = json['primaryDiscipline'];
  }

  canActAs(actor: Actor): boolean {
    return this.roles.has(actor.role);
  }
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

export function setUserQueryParams(params: HttpParams, query: Partial<UserQuery>): HttpParams {
  params = setModelQueryParams(params, query);
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

export class CurrentUser extends User {
  readonly supervisedLabs: ModelIndexPage<Lab>;
  readonly plans: ModelIndexPage<ResearchPlan>;

  constructor(json: JsonObject) {
    super(json);

    this.supervisedLabs = modelIndexPageFromJsonObject('supervisedLabs', Lab, json);
    this.plans = modelIndexPageFromJsonObject('plans', ResearchPlan, json);
  }
}

export class TemporaryAccessUser extends User {
  tokenExpiresAt: Date;
  tokenExpired: boolean;
  tokenConsumedAt: Date | null;
  tokenConsumed: boolean;

  constructor(json: JsonObject) {
    super(json);

    if (typeof json['tokenExpiresAt'] !== 'string') {
      throw new Error("Expected a string 'tokenExpiresAt'")
    }
    this.tokenExpiresAt = parseISO(json['tokenExpiresAt']);

    if (typeof json['tokenExpired'] !== 'boolean') {
      throw new Error("Expected a boolean 'tokenExpired'")
    }
    this.tokenExpired = json['tokenExpired'];

    if (json['tokenConsumedAt'] == null) {
      this.tokenConsumedAt = null;
    } else if (typeof json['tokenConsumedAt'] === 'string') {
      this.tokenConsumedAt = parseISO(json['tokenConsumedAt']);
    } else {
      throw new Error("Expected a string or null 'tokenConsumedAt'");
    }

    if (typeof json['tokenConsumed'] !== 'boolean') {
      throw new Error("Expected a boolean 'tokenConsumed'");
    }
    this.tokenConsumed = json['tokenConsumed']
  }
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

export interface CreateTemporaryUserResult {
  token: string;
  tokenExpiresAt: Date;
  user: User;
}


export interface FinalizeTemporaryUserRequest {
  id: string;
  token: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class UserService extends RestfulService<User, UserQuery> {
  override readonly path: string = '/users';

  override readonly model = User;
  override readonly setModelQueryParams = setUserQueryParams;

  me(): Observable<CurrentUser> {
    return this._httpClient
      .get<JsonObject>(this.indexMethodUrl('me'))
      .pipe(map((result) => new CurrentUser(result)));
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
    const responseFromJsonObject = (json: JsonObject) => {
      if (typeof json['token'] !== 'string') {
        throw new Error("Expected a string 'token'");
      }
      if (typeof json['tokenExpiresAt'] !== 'string') {
        throw new Error("Expected a string 'tokenExpiresAt'")
      }
      if (!isJsonObject(json['user'])) {
        throw new Error("Expected a json object 'user'");
      }
      return {
        token: json['token'],
        tokenExpiresAt: parseISO(json['tokenExpiresAt']),
        user: this.modelFromJsonObject(json['user'])
      };
    }
    return this._httpClient
      .post<JsonObject>(
        this.indexMethodUrl('create-temporary-user'),
        request
      ).pipe(
        map((result) => responseFromJsonObject(result))
      );
  }


  fetchTemporaryUser(id: string, accessToken: string): Observable<TemporaryAccessUser> {
    return this._httpClient
      .get<JsonObject>(
        urlJoin(this.indexMethodUrl('finalize-temporary-user'), id),
        { params: { token: accessToken } }
      ).pipe(
        map((result) => new TemporaryAccessUser(result))
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
