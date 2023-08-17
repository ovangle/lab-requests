import { AbstractControl, FormControl, FormGroup, Validators } from "@angular/forms";

export const CAMPUS_CODES = ['CNS', 'BDG', 'GLD', 'MEL', 'MKY', 'PTH', 'ROK', 'SYD', 'OTH'] as const;

export type CampusCode = typeof CAMPUS_CODES[number];
export function isOtherCampusCode(code: CampusCode | null | undefined) {
    return code === 'OTH';
}

export class Campus {
    readonly code: CampusCode;
    readonly otherDescription: string | null;

    constructor(campus: {readonly code: CampusCode} & Partial<Campus>) {
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

export type CampusForm = FormGroup<{
    code: FormControl<CampusCode | null>;
    otherDescription: FormControl<string | null>;
}>;

export function campusFormValidator(f: AbstractControl<any, any>): { [k: string]: any } | null {
    const campusForm = f.parent as CampusForm;
    if (isOtherCampusCode(campusForm.controls['code'].value!)) {
        if (campusForm.controls['otherDescription'].value == null) {
            return {
                'otherDescriptionRequired': 'A description is required'
            };
        }
    }
    return null;
}

export function createCampusForm(campus: Partial<Campus>): CampusForm {
    return new FormGroup({
        code: new FormControl<CampusCode | null>(
            campus.code || null,
            {validators: [Validators.required]
        }),
        otherDescription: new FormControl<string | null>(
            campus.otherDescription || null,
            {validators: Validators.required
        })
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
    if (campus === null) {
        return 'unknown';
    }
    if (typeof campus === 'string') {
        return CAMPUS_NAMES[campus];
    }
    return campus.code === 'OTH' ? campus.otherDescription! : CAMPUS_NAMES[campus.code];
}