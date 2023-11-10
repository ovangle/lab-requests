import { isJsonObject } from "src/app/utils/is-json-object";
import { Model, ModelLookup, ModelMeta, ModelParams, ModelPatch, modelLookupToHttpParams, modelParamsFromJsonObject, modelPatchToJson } from "../common/model/model";
import { Role } from './role';
import { Actor, actorFromJson } from "./actor";
import { HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { RestfulService } from "../common/model/model-service";
import { ModelCollection } from "../common/model/model-collection";
import { Observable, map } from "rxjs";


export interface UserParams extends ModelParams {
    email: string; 

    actors: readonly Actor[];
}

export class User extends Model implements UserParams {
    readonly email: string;
    readonly actors: readonly Actor[];

    constructor(params: UserParams) {
        super(params);
        this.email = params.email;

        this.actors = params.actors;
    }

    get roles() {
        return this.actors.map(actor => actor.role);
    }
    hasRole(role: Role): boolean {
        return this.actors.some(actor => actor.role === role);
    }

    canActAs(actor: Actor) {
        return this.hasRole(actor.role);
    }
}

function userParamsFromJson(json: unknown) {
    if (!isJsonObject(json)) {
        throw new Error('Not a json object');
    }
    const baseParams = modelParamsFromJsonObject(json);
    if (typeof json['email'] !== 'string') {
        throw new Error('Expected a string \'email\'')
    }

    let actors: ReadonlyArray<Actor> = [];
    if (Array.isArray(json['actors'])) {
        actors = json['actors'].map(actorFromJson);
    }
    return {
        ...baseParams,
        email: json['email'],
        actors
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

@Injectable({providedIn: 'root'})
export class UserMeta extends ModelMeta<User, UserPatch, UserLookup> {
    readonly model = User;
    readonly modelParamsFromJson = userParamsFromJson;
    readonly modelPatchToJson = userPatchToJson;
    readonly lookupToHttpParams = userLookupToHttpParams;
}

@Injectable({providedIn: 'root'})
export class UserService extends RestfulService<User, UserPatch, UserLookup> {
    override readonly metadata = inject(UserMeta);
    override readonly path = '/users';

    me(): Observable<User> {
        return this._httpClient.get(this.indexMethodUrl('me')).pipe(
            map(result => this.modelFromJson(result))
        )
    }
}


@Injectable({providedIn: 'root'})
export class UserCollection extends ModelCollection<User, UserPatch> {
    constructor(service: UserService) {
        super(service);
    }
}