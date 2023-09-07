import { FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { Resource } from "../common/resource";



/**
 * A service represents a task performed by a lab tech, or
 * contracted out to a third party which is required to complete
 * the research plan.
 */
export class Service implements Resource {
    readonly type = 'service';

    readonly name: string;

    readonly isLabTechService: boolean;

    readonly isUniversitySupplied: boolean;
    readonly estimatedCost: number;

    constructor(params: Partial<Service>) {
        if (!params.name) {
            throw new Error('A service name is required');
        }
        this.name = params.name;

        this.isLabTechService = !!params.isLabTechService;
        this.isUniversitySupplied = !!params.isUniversitySupplied;

        if (this.isLabTechService && !this.isUniversitySupplied) {
            throw new Error('A lab tech service must always be university supplied');
        }

        this.estimatedCost = params.estimatedCost || 0;
    }
}

export type ServiceForm = FormGroup<{
    type: FormControl<'service'>;
    name: FormControl<string>;
    isLabTechService: FormControl<boolean>;

    isUniversitySupplied: FormControl<boolean>;
    estimatedCost: FormControl<number>;
}>;

export function serviceForm(service: Partial<Service>): ServiceForm {
    return new FormGroup({
        type: new FormControl('service', {nonNullable: true}),
        name: new FormControl(service.name || '', {nonNullable: true, validators: [Validators.required]}),
        isLabTechService: new FormControl(!!service.isLabTechService, {nonNullable: true}),
        isUniversitySupplied: new FormControl(!!service.isUniversitySupplied, {nonNullable: true}),
        estimatedCost: new FormControl(service.estimatedCost || 0, {nonNullable: true})
    });
}

export type ServiceFormErrors = ValidationErrors & {
    name?: { required: string | null };
};



