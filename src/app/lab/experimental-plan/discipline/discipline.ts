
export const DISCLIPLINES = [
    'Electrical',
    'Mechanical',
    'Civil',
    'ICT'
] as const;

export type Discipline = typeof DISCLIPLINES[number];