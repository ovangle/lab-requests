
export const DISCLIPLINES = [
    'Electrical',
    'Mechanical',
    'Civil',
    'ICT'
] as const;

export type Discipline = typeof DISCLIPLINES[number];

export function isDiscipline(obj: any): obj is Discipline {
    return typeof obj === 'string'
        && DISCLIPLINES.includes(obj as any);
}

export function disciplineFromJson(json: unknown): Discipline {
    if (!isDiscipline(json)) { 
        throw new Error(`Expected one of [${DISCLIPLINES.join(',')}]`);
    }
    return json;
}