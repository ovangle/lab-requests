import { AbstractControl, FormControl, FormGroup, Validators } from "@angular/forms";

export const CAMPUS_CODES = ['CNS', 'BDG', 'GLD', 'MEL', 'MKY', 'PTH', 'ROK', 'SYD', 'OTH'] as const;

export type CampusCode = typeof CAMPUS_CODES[number];

export function isCampusCode(obj: any): obj is CampusCode {
    return typeof obj === 'string' && CAMPUS_CODES.includes(obj as any);
}

export function isOtherCampusCode(code: CampusCode | null | undefined) {
    return code === 'OTH';
}

export class Campus {
    readonly code: CampusCode;
    readonly otherDescription: string | null;

    constructor(campus: Partial<Campus>) {
        if (!isCampusCode(campus.code))
            throw new Error('Requires a campus code')
        this.code = campus.code;
        if (campus.code === 'OTH') {
            if (!campus.otherDescription) {
                throw new Error('OTH campus requires description');
            }
            this.otherDescription = campus.otherDescription;
        } else {
            this.otherDescription = null;
        }
    }
}

export function isCampus(obj: any): obj is Campus {
    return obj instanceof Campus;
}

export type CampusForm = FormGroup<{
    code: FormControl<CampusCode | null>;
    otherDescription: FormControl<string | null>;
}>;

export function createCampusForm(campus: Partial<Campus>): CampusForm {

    function campusDescriptionRequired(control: AbstractControl<string | null>) {
        const campusForm = control.parent;

        if (campusForm && isOtherCampusCode(campusForm.value.code)) {
            return Validators.required(control);
        }
        return null;
    }

    return new FormGroup({
        code: new FormControl<CampusCode | null>(
            campus.code || null,
            {validators: [Validators.required]
        }),
        otherDescription: new FormControl<string>(
            campus.otherDescription || '',
            {validators: campusDescriptionRequired}
        )
    });
}

export const CAMPUS_NAMES = Object.fromEntries([
    ['CNS', 'Cairns'],
    ['BDG', 'Bundaberg'],
    ['GLD', 'Gold Coast'],
    ['MEL', 'Melbourne'],
    ['MKY', 'Mackay'],
    ['PTH', 'Perth'],
    ['ROK', 'Rockhampton'],
    ['SYD', 'Sydney'],
    ['OTH', 'Other...']
]);

export function campusName(campus: Campus | CampusCode | null): string {
    if (campus == null) {
        return 'unknown';
    }
    if (typeof campus === 'string') {
        return CAMPUS_NAMES[campus];
    }
    return campus.code === 'OTH' ? campus.otherDescription! : CAMPUS_NAMES[campus.code];
}