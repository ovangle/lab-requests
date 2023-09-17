import { FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { CostEstimate, Resource, costEstimateFromJson, costEstimateToJson } from "../../resource/resource";



/**
 * A service represents a task performed by a lab tech, or
 * contracted out to a third party which is required to complete
 * the research plan.
 */
export class Service implements Resource {
    readonly type = 'service';
    readonly index: number | 'create';

    readonly name: string;

    readonly isLabTechService: boolean;

    readonly costEstimate: CostEstimate | null;

    constructor(params: Partial<Service>) {
        if (!params.name) {
            throw new Error('A service name is required');
        }
        this.name = params.name;
        this.index = params.index || 'create';

        this.isLabTechService = !!params.isLabTechService;
        this.costEstimate = params.costEstimate || null;
    }
}

export function serviceFromJson(json: {[k: string]: any}): Service {
    return new Service({
        name: json['name'],
        isLabTechService: json['isLabTechService'],
        costEstimate: json['costEstimate'] ? costEstimateFromJson(json['costEstimate']) : null
    })
}

export function serviceToJson(service: Service) {
    return {
        name: service.name,
        isLabTechService: service.isLabTechService,
        costEstimate: service.costEstimate && costEstimateToJson(service.costEstimate)
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
        isUniversitySupplied: new FormControl(!!service.costEstimate?.isUniversitySupplied, {nonNullable: true}),
        estimatedCost: new FormControl(service.costEstimate?.estimatedCost || 0, {nonNullable: true})
    });
}

export type ServiceFormErrors = ValidationErrors & {
    name?: { required: string | null };
};



