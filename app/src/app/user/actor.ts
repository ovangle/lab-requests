import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isJsonObject } from 'src/app/utils/is-json-object';
import { Role, roleFromJson } from './common/role';

/**
 * An actor is a user which is fulfilling a role
 */
export interface Actor {
  readonly role: Role;
}

export function actorFromJson(obj: unknown): Actor {
  if (!isJsonObject(obj)) {
    throw new Error('Expected a json object');
  }
  return {
    role: roleFromJson(obj['role']),
  };
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
