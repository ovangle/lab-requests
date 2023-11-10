

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
