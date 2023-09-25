import { FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { CostEstimate, Resource, ResourceParams, costEstimateFromJson, costEstimateToJson } from "../../resource/resource";
import { collectFieldErrors } from "src/app/utils/forms/validators";
import { Observable, filter, map, startWith } from "rxjs";

export interface ServiceParams extends ResourceParams<Service> {
    
}

/**
 * A service represents a task performed by a lab tech, or
 * contracted out to a third party which is required to complete
 * the research plan.
 * 
 * TODO: Rename 'tasks'?
 */
export class Service implements Resource {
    readonly type = 'service';
    readonly planId: string;
    readonly workUnitId: string;
    readonly index: number | 'create';

    readonly name: string;
    readonly description: string;

    readonly supplier: 'researcher' | 'technician' | 'other';
    readonly externalSupplierDescription: string;

    readonly costEstimate: CostEstimate | null;

    constructor(params: ServiceParams) {
        this.planId = params.planId;
        this.workUnitId = params.workUnitId;
        this.index = params.index;

        if (!params.name) {
            throw new Error('A service name is required');
        }
        this.name = params.name;
        this.description = params.description || '';
        this.index = params.index || 'create';

        if (!['researcher', 'technician', 'external'].includes(params.supplier || '')) {
            throw new Error('Invalid service. Expected a supplier')
        }

        this.supplier = params.supplier!;
        this.externalSupplierDescription = params.externalSupplierDescription || '';
        this.costEstimate = params.costEstimate || null;
    }
}

export function serviceFromJson(json: {[k: string]: any}): Service {
    return new Service({
        planId: json['planId'],
        workUnitId: json['workUnitId'],
        index: json['index'],
        name: json['name'],
        description: json['description'],
        supplier: json['supplier'],
        externalSupplierDescription: json['externalSupplierDescription'],
        costEstimate: json['costEstimate'] ? costEstimateFromJson(json['costEstimate']) : null
    })
}

export function serviceToJson(service: Service) {
    return {
        planId: service.planId,
        workUnitId: service.workUnitId,
        index: service.index,

        name: service.name,
        description: service.description,
        supplier: service.supplier,
        externalSupplierDescription: service.externalSupplierDescription,
        costEstimate: service.costEstimate && costEstimateToJson(service.costEstimate)
    }
}

export type ServiceForm = FormGroup<{
    type: FormControl<'service'>;
    name: FormControl<string>;
    description: FormControl<string>;
    supplier: FormControl<'technician' | 'researcher' | 'other'>;
    externalSupplierDescription: FormControl<string>;

    isUniversitySupplied: FormControl<boolean>;
    estimatedCost: FormControl<number>;
}>;

export function serviceForm(service: Partial<Service>): ServiceForm {
    return new FormGroup({
        type: new FormControl('service', {nonNullable: true}),
        name: new FormControl(service.name || '', {nonNullable: true, validators: [Validators.required]}),
        description: new FormControl(service.description || '', {nonNullable: true}),
        supplier: new FormControl<'researcher' | 'technician' | 'other'>('researcher', {nonNullable: true}),
        externalSupplierDescription: new FormControl<string>('', {nonNullable: true}),
        isUniversitySupplied: new FormControl(!!service.costEstimate?.isUniversitySupplied, {nonNullable: true}),
        estimatedCost: new FormControl(service.costEstimate?.estimatedCost || 0, {nonNullable: true}),
    }, {
        asyncValidators: [
            (c) => collectFieldErrors(c as ServiceForm)
        ]
    });
}

export type ServiceFormErrors = ValidationErrors & {
    name: { required: string | null };
};

export function serviceFormErrors(form: ServiceForm): Observable<ServiceFormErrors | null> {
    return form.statusChanges.pipe(
        startWith(form.status),
        filter(status => status != 'PENDING'),
        map(() => form.errors as ServiceFormErrors)
    ) ;
}



