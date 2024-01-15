export const DISCLIPLINES = [
  'electrical',
  'mechanical',
  'civil',
  'ict',
] as const;

export type Discipline = (typeof DISCLIPLINES)[number];

export function isDiscipline(obj: any): obj is Discipline {
  return typeof obj === 'string' && DISCLIPLINES.includes(obj as any);
}

export function disciplineFromJson(json: unknown): Discipline {
  if (!isDiscipline(json)) {
    throw new Error(`Expected one of [${DISCLIPLINES.join(',')}]`);
  }
  return json;
}

export interface DisciplineFormatOptions {

}

export function formatDiscipline(discipline: Discipline, options: Partial<DisciplineFormatOptions> = {}) {
  switch (discipline) {
    case 'ict':
      return 'ICT';
    case 'civil':
      return 'Civil';
    case 'electrical':
      return 'Electrical';
    case 'mechanical':
      return 'Mechanical';
    default:
      throw new Error(`Unexpected discipline '${discipline}'`);
  }
}