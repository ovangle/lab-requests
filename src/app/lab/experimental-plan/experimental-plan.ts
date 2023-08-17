import { Injectable, InjectionToken } from "@angular/core";
import { Software, SoftwareForm, createSoftwareForm } from "../resources/software/software";
import { Equipment, EquipmentForm, createEquipmentResourceForm } from "../resources/equipment/equipment";
import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { Resource, ResourceType } from "../resources/common/resource";
import { BehaviorSubject, Observable, Subject, filter, map } from "rxjs";
import { __runInitializers } from "tslib";
import { InputMaterial, InputMaterialForm, createInputMaterialForm } from "../resources/material/input/input-material";
import { OutputMaterial, OutputMaterialForm, createOutputMaterialForm } from "../resources/material/output/output-material";
import { CampusCode } from "./campus/campus";
import { Discipline } from "./discipline/discipline";
import { ExperimentalPlanType } from "./type/experimental-plan-type";

export class ExperimentalPlan {
    title: string;
    planType: ExperimentalPlanType;
    processSummary: string;

    /**
     * Emails of any supervisors
     */
    supervisor: string;

    /**
     * Emails of any technicians you want access to this plan.
     */
    technicians: string[];
    get primaryTechnician(): string | null {
        return this.technicians[0] || null;
    }

    campus: CampusCode;
    discipline: Discipline;

    projectFrom: Date | null;
    projectTo: Date | null;

    /**
     * Researchers other than the ones who submitted the form.
     */
    additionalResearchers: string | string[];

    locations: Location[];

    softwares: Software[];
    equipments: Equipment[];
    inputMaterials: InputMaterial[];
    outputMaterials: OutputMaterial[];

    submittedBy: string;
    submittedAt: Date;

    constructor(plan?: Partial<ExperimentalPlan>) {
        this.title = plan?.title || '';
        this.campus = plan?.campus || 'MEL';
        this.processSummary = plan?.processSummary || '';

        this.softwares = plan?.softwares || [];
        this.equipments = plan?.equipments || [];
        this.inputMaterials = plan?.inputMaterials || [];
        this.outputMaterials = plan?.outputMaterials || [];
    }
}

export function getResources<T extends Resource>(plan: ExperimentalPlan, resourceType: ResourceType): T[] {
    switch (resourceType) {
        case 'equipment':
            return plan.equipments as any[];
        case 'software':
            return plan.softwares as any[];
        case 'input-material':
            return plan.inputMaterials as any[];
        case 'output-material':
            return plan.outputMaterials as any[];
    }
}
export function setResources(plan: ExperimentalPlan, resourceType: ResourceType, resources: Resource[]) {
    switch (resourceType) {
        case 'equipment':
            return new ExperimentalPlan({
                ...plan,
                equipments: resources as Equipment[]
            });
        case 'software':
            return new ExperimentalPlan({
                ...plan,
                softwares: resources as Software[]
            })
        case 'input-material':
            return new ExperimentalPlan({
                ...plan,
                inputMaterials: resources as InputMaterial[]
            })
        case 'output-material':
            return new ExperimentalPlan({
                ...plan,
                outputMaterials: resources as OutputMaterial[]
            });
    }
}

export function projectAdditionalResearchersToArray(project: ExperimentalPlan): string[] {
    const researchers = project.additionalResearchers;
    if (typeof researchers === 'string') {
        return researchers
            .split(/\s+/)
            .map(s => s.trim().toLocaleLowerCase())
            .filter(s => s != '');
    }
    return researchers;
}

export type ExperimentalPlanForm = FormGroup<{
    title: FormControl<string>;
    supervisor: FormControl<string>;
    discipline: FormControl<Discipline | null>;
    planType: FormControl<ExperimentalPlanType | null>;
    processSummary: FormControl<string>;
    startDate: FormControl<Date | null>;
    endDate: FormControl<Date | null>;
    softwares: FormArray<SoftwareForm>;
    equipments: FormArray<EquipmentForm>;
    'input-materials': FormArray<InputMaterialForm>;
    'output-materials': FormArray<OutputMaterialForm>;
}>;

function resourceFormAsResource(form: FormGroup<any>, resourceType: ResourceType) {
    switch (resourceType) {
        case 'equipment':
            return new Equipment(form.value);
        case 'software':
            return new Software(form.value);
        case 'input-material':
            return new InputMaterial(form.value);
        case 'output-material':
            return new OutputMaterial(form.value);
    }
}
export function createExperimentalPlanForm(plan: Partial<ExperimentalPlan>): ExperimentalPlanForm {
    return new FormGroup({
        title: new FormControl(plan.title || '', { nonNullable: true , validators: [Validators.required]}),
        supervisor: new FormControl(
            plan.supervisor || '',
            {nonNullable: true, validators: [Validators.email]}
        ),
        discipline: new FormControl(plan.discipline || null),
        planType: new FormControl<ExperimentalPlanType | null>(plan.planType || null, [Validators.required]),
        processSummary: new FormControl(plan?.processSummary || '', { nonNullable: true }),

        startDate: new FormControl<Date | null>(null),
        endDate: new FormControl<Date | null>(null),

        equipments: new FormArray(
            (plan?.equipments || []).map(e => createEquipmentResourceForm(e))
        ),
        softwares: new FormArray(
            (plan?.softwares || []).map(s => createSoftwareForm(s))
        ),
        'input-materials': new FormArray(
            (plan?.inputMaterials || []).map(m => createInputMaterialForm(m))
        ),
        'output-materials': new FormArray(
            (plan?.outputMaterials || []).map(m => createOutputMaterialForm(m))
        )
    });
}

function createResourceForm<T extends Resource>(resourceType: ResourceType, resource: Partial<T>) {
    switch (resourceType) {
        case 'equipment':
            return createEquipmentResourceForm(resource as Partial<Equipment>);
        case 'software':
            return createSoftwareForm(resource as Partial<Software>);
        case 'input-material':
            return createInputMaterialForm(resource as Partial<InputMaterial>);
        case 'output-material':
            return createOutputMaterialForm(resource as Partial<OutputMaterial>);
    }
}


@Injectable()
export class ExperimentalPlanService {
    current = new BehaviorSubject<ExperimentalPlan | null>(null);

    form: ExperimentalPlanForm;

    init(plan: ExperimentalPlan) {
        this.current.next(plan);
        this.form = createExperimentalPlanForm(plan);
    }

    protected getResourceValue<T>(resourceType: ResourceType, index: number): T | null {
        if (this.current.value === null) {
            return null;
        }
        return getResources(this.current.value, resourceType)[index] as T || null;
    }

    getResourceFormArray<F extends FormGroup<any>>(resourceType: ResourceType): FormArray<F> {
        switch (resourceType) {
            case 'equipment':
                return this.form.controls['equipments'] as FormArray<any>;
            case 'software':
                return this.form.controls['softwares'] as FormArray<any>;
            case 'input-material':
                return this.form.controls['input-materials'] as FormArray<any>;
            case 'output-material':
                return this.form.controls['output-materials'] as FormArray<any>;
        }
    }

    getResourceForm<F extends FormGroup<any>>(resourceType: ResourceType, index: number): F | undefined {
        return this.getResourceFormArray<F>(resourceType).controls[index] as F;
    }

    commitResourceFormAt(resourceType: ResourceType, index: number) {
        const resourceForm = this.getResourceForm(resourceType, index);
        if (resourceForm === undefined) {
            // Can only commit a resource which has a form in the array.
            throw new Error(`No resource form at index ${index}`)
        }
        if (!resourceForm.valid) {
            throw new Error(`Cannot commit an invalid form`);
        }
        const newResource = resourceFormAsResource(resourceForm, resourceType);

        const resources = [...getResources(this.current.value!, resourceType)];
        resources.splice(index, 1, newResource);
        this.current.next(
            setResources(this.current.value!, resourceType, resources)
        );
    }

    revertResourceFormAt<T extends Resource>(resourceType: ResourceType, index: number) {
        const resourceForms = this.getResourceFormArray(resourceType);
        resourceForms.removeAt(index);
        if (index !== resourceForms.length) {
            resourceForms.insert(index, this._createResourceForm(resourceType, index));
        }
    }

    pushCreateResourceForm(resourceType: ResourceType) {
        const formArray = this.getResourceFormArray(resourceType);
        formArray.push(this._createResourceForm(resourceType, formArray.length));
    }

    /**
     *
     * @param resourceType
     * @param index
     * @returns
     */
    protected _createResourceForm<T extends Resource>(resourceType: ResourceType, index: number) {
        switch (resourceType) {
            case 'equipment':
                return createEquipmentResourceForm(
                    this.getResourceValue<Equipment>(resourceType, index) || {}
                );
            case 'software':
                return createSoftwareForm(
                    this.getResourceValue<Software>(resourceType, index) || {}
                );
            case 'input-material':
                return createInputMaterialForm(
                    this.getResourceValue<InputMaterial>(resourceType, index) || {}
                );
            case 'output-material':
                return createOutputMaterialForm(
                    this.getResourceValue<OutputMaterial>(resourceType, index) || {}
                );
        }
    }


    deleteResourceAt(resourceType: ResourceType, index: number) {
        const resourceForms = this.getResourceFormArray(resourceType);
        resourceForms.removeAt(index);

        const resources = [...getResources(this.current.value!, resourceType)];
        resources.splice(index, 1);
        this.current.next(
            setResources(this.current.value!, resourceType, resources)
        );
    }

    getResources<T extends Resource>(type: ResourceType): Observable<T[]> {
        return this.current.pipe(
            filter((p): p is ExperimentalPlan => p !== null),
            map((plan) => getResources<T>(plan, type))
        );
    }

    getResourceAt<T extends Resource>(type: ResourceType, index: number): Observable<T> {
        return this.getResources<T>(type).pipe(
            map(resources => resources[index])
        );
    }


}