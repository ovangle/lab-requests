import { ThisReceiver } from "@angular/compiler";
import { FormControl, FormGroup, Validators } from "@angular/forms";

export const RESOURCE_DISPOSAL_TYPES = [
    'general',
    'bulk/landfill',
    'recyclable',
    'liquids/oil',
    'hazardous',
    'other'
] as const;

export type ResourceDisposalType = typeof RESOURCE_DISPOSAL_TYPES[number];

export function isResourceDisposalType(obj: any): obj is ResourceDisposalType {
    return typeof obj === 'string' && RESOURCE_DISPOSAL_TYPES.includes(obj as never);
}

export class ResourceDisposal {
    readonly type: ResourceDisposalType;
    readonly otherDescription: string;

    readonly estimatedCost: number;

    constructor(params: Partial<ResourceDisposal>) {
        this.type = params.type || 'general';

        this.otherDescription = params.otherDescription || '';
        this.estimatedCost = params.estimatedCost || 0;
    }

    get typeName(): string {
        if (this.type === 'other') {
            return this.otherDescription;
        }
        return this.type;
    }
}

export type ResourceDisposalForm = FormGroup<{
    type: FormControl<ResourceDisposalType>;
    otherDescription: FormControl<string>;
    estimatedCost: FormControl<number>;
}>;

export function createResourceDisposalForm(r: Partial<ResourceDisposal>): ResourceDisposalForm {
    return new FormGroup({
        type: new FormControl<ResourceDisposalType>(
            r.type || 'general',
            {nonNullable: true, validators: Validators.required}
        ),
        otherDescription: new FormControl<string>(
            r.otherDescription || '',
            {nonNullable: true}
        ),
        estimatedCost: new FormControl<number>(
            r.estimatedCost || 0,
            {nonNullable: true}
        )
    });
}