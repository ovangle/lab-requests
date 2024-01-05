/*
export const ACTOR_ROLES = [
    'student',
    'lab-technician',
    'academic',
    'supervisor',
];
*/

export type Role = string;

export function isRole(obj: unknown): obj is Role {
  return typeof obj === 'string';
}

export function roleFromJson(json: unknown): Role {
  if (!isRole(json)) {
    throw new Error('Expected an actor role');
  }
  return json;
}
