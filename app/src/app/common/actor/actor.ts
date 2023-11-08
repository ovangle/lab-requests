import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";


export const ACTOR_ROLES = [
    'student',
    'lab-technician',
    'academic',
    'supervisor',
];

export type Role = typeof ACTOR_ROLES[number];

export function isRole(obj: unknown): obj is Role {
    return typeof obj === 'string' && ACTOR_ROLES.includes(obj);
}

export function roleFromJson(json: unknown): Role {
    if (!isRole(json)) {
        throw new Error('Expected an actor role');
    }
    return json;
}

export interface Actor {
    readonly role: Role;
}


@Injectable()
export class ActorContext {
    readonly actorSubject = new BehaviorSubject<Role[]>([]);

    get roles(): Role[] {
        return this.actorSubject.value;
    }

    get isStudent() {
        return this.roles.includes('student');
    }

    get isAcademic() {
        return this.roles.includes('academic');
    }

    get isLabTechnician() {
        return this.roles.includes('lab-technician');
    }

    get isSupervisor() {
        return this.roles.includes('supervisor');
    }
}