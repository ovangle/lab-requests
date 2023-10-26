
export const labTypes = [
    'Electrical',
    'Mechanical',
    'Civil',
    'ICT'
] as const;

export type LabType = typeof labTypes[number];

export function isLabType(obj: any): obj is LabType {
    return typeof obj === 'string'
        && labTypes.includes(obj as any);
}

export function formatLabType(labType: LabType): string {
    return labType;
}