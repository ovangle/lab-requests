import { FormGroup } from '@angular/forms';

export interface HazardClassGroup {
  readonly id: number;
  readonly name: string;
  readonly classes: HazardClass[];
}

export interface HazardClass {
  readonly groupId: number;
  readonly id: number;
  readonly description: string;
}

export const HAZARDOUS_MATERIAL_CLASSES: HazardClassGroup[] = [
  {
    id: 1,
    name: 'Explosives',
    classes: [
      { id: 1, description: 'mass explosion hazard' },
      { id: 2, description: 'projection hazard, no mass exposion hazard' },
      { id: 3, description: 'fire hazard' },
      { id: 4, description: 'no significant hazard' },
      { id: 5, description: 'insensitve, a mass explosion hazard' },
      { id: 6, description: 'insensitive, no mass explosion hazard' },
    ].map((v) => ({ groupId: 1, ...v })),
  },
  {
    id: 2,
    name: 'Gases',
    classes: [
      { id: 1, description: 'Flammable gas' },
      { id: 2, description: 'Non-flammable, non-toxic gas' },
      { id: 3, description: 'Toxic gas' },
    ].map((v) => ({ groupId: 2, ...v })),
  },
  {
    id: 3,
    name: 'Flammable liquids',
    classes: [{ id: 0, description: 'Flammable liquid' }].map((v) => ({
      groupId: 3,
      ...v,
    })),
  },
  {
    id: 4,
    name: 'Flammable solids',
    classes: [
      {
        id: 1,
        description:
          'Flammable solid, self-reactive substances or solid desensitized explosive',
      },
      { id: 2, description: 'liable to spontaneous combustion' },
      { id: 3, description: 'In contact with water emits flammable gas' },
    ].map((v) => ({ groupId: 4, ...v })),
  },
  {
    id: 5,
    name: 'Oxidizing substances and organic peroxides',
    classes: [
      { id: 1, description: 'Oxidizing substance' },
      { id: 2, description: 'Organic peroxide' },
    ].map((v) => ({ groupId: 5, ...v })),
  },
  {
    id: 6,
    name: 'Toxic or infectious substances',
    classes: [
      { id: 1, description: 'Toxic substance' },
      { id: 2, description: 'Infectious substance' },
    ].map((v) => ({ groupId: 6, ...v })),
  },
  {
    id: 7,
    name: 'Radioactive materials',
    classes: [{ id: 0, description: 'Radioactive material' }].map((v) => ({
      groupId: 7,
      ...v,
    })),
  },
  {
    id: 8,
    name: 'Corrosive substances',
    classes: [{ id: 0, description: 'Corrosive substance' }].map((v) => ({
      groupId: 8,
      ...v,
    })),
  },
  {
    id: 9,
    name: 'Miscelaneous dangerous substances',
    classes: [{ id: 0, description: 'Miscelaneous dangerous substance' }].map(
      (v) => ({ groupId: 9, ...v }),
    ),
  },
];

export function hazardClassGroup(cls: HazardClass): HazardClassGroup {
  const maybeGroup = HAZARDOUS_MATERIAL_CLASSES[cls.groupId - 1];
  if (maybeGroup?.id !== cls.groupId) {
    throw new Error(
      `Could not find group for hazard class '${cls.description}'`,
    );
  }
  return maybeGroup;
}

export function hazardClassDivision(cls: HazardClass): string {
  return cls.id !== 0 ? `${cls.groupId}.${cls.id}` : `${cls.groupId}`;
}

function divisionIds(division: string): [number, number] {
  const re = /(\d+)(\.(\d+))?/;
  const m = division.match(re);
  if (m) {
    return [m[1], m[3] || '0'].map((x) => Number.parseInt(x)) as [
      number,
      number,
    ];
  }
  throw new Error(`Division must match ${re}, got '${division}'`);
}

export function hazardClassFromDivision(division: string): HazardClass {
  const [groupId, divisionId] = divisionIds(division);
  const group = HAZARDOUS_MATERIAL_CLASSES[groupId - 1];
  if (group === undefined) {
    throw new Error(`No group with group id ${groupId}`);
  }
  const cls = group.classes[divisionId];
  if (cls === undefined) {
    throw new Error(`Class ${divisionId} does not exist in group ${groupId}`);
  }
  return cls;
}

export function hazardClassesFromJson(json: any[]): HazardClass[] {
  return json.map(hazardClassFromDivision);
}

export function hazardClassesToJson(hazardClasses: HazardClass[]): string[] {
  return hazardClasses.map(hazardClassDivision);
}

export function hazardClassLabelImage(cls: HazardClass) {
  return `/assets/hazard-labels/DOT_hazmat_class_${hazardClassDivision(
    cls,
  )}.svg`;
}
