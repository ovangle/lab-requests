import { FormArray, FormGroup, ValidationErrors } from "@angular/forms";
import { Software, SoftwareForm, SoftwareFormErrors, createSoftwareForm } from "./software/software";
import { InputMaterial, InputMaterialForm, InputMaterialFormErrors, createInputMaterialForm } from "./material/input/input-material";
import { OutputMaterial, OutputMaterialForm, OutputMaterialFormErrors, createOutputMaterialForm } from "./material/output/output-material";
import { Resource, ResourceType } from "./common/resource";
import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, Observable, Subscription, filter, firstValueFrom, map } from "rxjs";
import { Service, ServiceForm, ServiceFormErrors, serviceForm } from "./service/service";
import { EquipmentLease, EquipmentLeaseForm, EquipmentLeaseFormErrors } from "./equipment/equipment-lease";
import { ModelService } from "src/app/utils/models/model-service";
import { UpdateContext } from "src/app/utils/models/model-context";


export class ResourceContainer {
    equipments: EquipmentLease[];
    services: Service[];
    softwares: Software[];

    inputMaterials: InputMaterial[];
    outputMaterials: OutputMaterial[];

    constructor(params: Partial<ResourceContainer>) {
        this.equipments = (params.equipments || [])
            .map(e => new EquipmentLease(e));
        this.services = (params.services || [])
            .map(s => new Service(s));
        this.softwares = (params.softwares || [])
            .map(s => new Software(s));
        this.inputMaterials = (params.inputMaterials || [])
            .map(inputMaterial => new InputMaterial(inputMaterial));
        this.outputMaterials = (params.outputMaterials || [])
            .map(outputMaterial => new OutputMaterial(outputMaterial));
    }

    getResources<T extends Resource>(t: ResourceType & T['type']): readonly T[] {
        switch (t) {
            case 'equipment':
                return this.equipments as any[];
            case 'software':
                return this.softwares as any[];
            case 'service':
                return this.services as any[];
            case 'input-material':
                return this.inputMaterials as any[];
            case 'output-material':
                return this.outputMaterials as any[];
            default:
                throw new Error(`Unexpected resource type ${t}`)
        }
    }

    getResourceAt<T extends Resource>(t: ResourceType & T['type'], index: number): T {
        const resources = this.getResources(t);
        if (index < 0 || index >= resources.length) {
            throw new Error(`No resource at ${index}`);
        }
        return resources[index];
    }
}

export class ResourceContainerPatch {
    addEquipments: EquipmentLease[];
    replaceEquipments: {[k: number]: EquipmentLease | null};

    addServices: Service[];
    replaceServices: {[k: number]: Service | null};

    addSoftwares: Software[];
    replaceSoftwares: {[k: number]: Software | null}

    addInputMaterials: InputMaterial[]; 
    replaceInputMaterials: {[k: number]: InputMaterial | null};

    addOutputMaterials: OutputMaterial[];
    replaceOutputMaterials: {[k: number]: OutputMaterial | null};
}

export function resourceContainerPatchFromContainer(container: ResourceContainer): ResourceContainerPatch {
    return {
        addEquipments: [],
        replaceEquipments: {},
        addServices: [],
        replaceServices: {},
        addSoftwares: [],
        replaceSoftwares: {},
        addInputMaterials: [],
        replaceInputMaterials: {},
        addOutputMaterials: [],
        replaceOutputMaterials: {}
    }
}

export type ResourceContainerFormControls = {
    addEquipments: FormArray<EquipmentLeaseForm>;
    replaceEquipments: FormGroup<{[k: number]: EquipmentLeaseForm}>;

    addServices: FormArray<ServiceForm>;
    replaceServices: FormGroup<{[k: number]: ServiceForm}>;

    addSoftwares: FormArray<SoftwareForm>;
    replaceSoftwares: FormGroup<{[k: number]: SoftwareForm}>;

    addInputMaterials: FormArray<InputMaterialForm>;
    replaceInputMaterials: FormGroup<{[k: number]: InputMaterialForm}>;

    addOutputMaterials: FormArray<OutputMaterialForm>;
    replaceOutputMaterials: FormGroup<{[k: number]: OutputMaterialForm}>;
};

export function resourceContainerFormControls(): ResourceContainerFormControls {
    return {
        addEquipments: new FormArray<EquipmentLeaseForm>([]),
        replaceEquipments: new FormGroup<{[k: string]: EquipmentLeaseForm}>({}),

        addServices: new FormArray<ServiceForm>([]),
        replaceServices: new FormGroup<{[k: string]: ServiceForm}>({}),

        addSoftwares: new FormArray<SoftwareForm>([]),
        replaceSoftwares: new FormGroup<{[k: string]: SoftwareForm}>({}),

        addInputMaterials: new FormArray<InputMaterialForm>([]),
        replaceInputMaterials: new FormGroup<{[k: string]: InputMaterialForm}>({}),

        addOutputMaterials: new FormArray<OutputMaterialForm>([]),
        replaceOutputMaterials: new FormGroup<{[k: string]: OutputMaterialForm}>({})
    }
}

export type ResourceContainerForm<T extends ResourceContainerFormControls> = FormGroup<T>;

export type ResourceContainerFormErrors = ValidationErrors & {
    addEquipments?: (EquipmentLeaseFormErrors | null)[];
    replaceEquipments?: {[k: string]: EquipmentLeaseFormErrors };

    addSoftwares?: (SoftwareFormErrors | null)[];
    replaceSoftwares?: {[k: string]: SoftwareFormErrors };

    addServices?: (ServiceFormErrors | null)[];
    replaceServices?: {[k: string]: ServiceFormErrors };
    addInputMaterials?: (InputMaterialFormErrors | null)[];
    replaceInputMaterials?: {[k: string]: InputMaterialFormErrors };

    addOutputMaterials?: (OutputMaterialFormErrors | null)[];
    replaceOutputMaterials?: {[k: string]: OutputMaterialFormErrors };
}

export function containerPatchFromForm(form: ResourceContainerForm<any>): ResourceContainerPatch {
    return { ...form.value };
}

function getResourceAddArray(form: ResourceContainerForm<any>, resourceType: ResourceType): FormArray<any> {
    switch (resourceType) {
        case 'equipment':
            return form.controls['addEquipments'] as FormArray<any>;
        case 'software':
            return form.controls['addSoftwares'] as FormArray<any>;
        case 'service':
            return form.controls['addServices'] as FormArray<any>;
        case 'input-material': 
            return form.controls['addInputMaterials'] as FormArray<any>;
        case 'output-material':
            return form.controls['addOutputMaterials'] as FormArray<any>;
    }
}

function getResourceReplaceGroup(form: ResourceContainerForm<any>, resourceType: ResourceType): FormGroup<{[k: string]: FormGroup<any>}> {
    switch (resourceType) {
        case 'equipment':
            return form.controls['replaceEquipments'] as FormGroup<{[k: string]: FormGroup<any>}>;
        case 'software':
            return form.controls['replaceSoftwares']  as FormGroup<{[k: string]: FormGroup<any>}>;
        case 'service':
            return form.controls['.replaceServices']  as FormGroup<{[k: string]: FormGroup<any>}>;
        case 'input-material':
            return form.controls['replaceInputMaterials'] as FormGroup<{[k: string]: FormGroup<any>}>;
        case 'output-material':
            return form.controls['replaceOutputMaterials'] as FormGroup<{[k: string]: FormGroup<any>}>;
    }
}

export function addResource(
    containerForm: ResourceContainerForm<any>, 
    resourceType: ResourceType, 
    resourceFormFactory: (resource?: Resource) => FormGroup<any>
) {
    const addArray = getResourceAddArray(containerForm, resourceType);
    addArray.push(resourceFormFactory());
}

export function cancelAddResource(
    containerForm: ResourceContainerForm<any>,
    resourceType: ResourceType
) {
    const addArray = getResourceAddArray(containerForm, resourceType);
    addArray.removeAt(addArray.length - 1)
}

export function replaceResourceAt(
    committedContainer: ResourceContainer,
    patchForm: ResourceContainerForm<any>,
    resourceType: ResourceType,
    index: number,
    resourceFormFactory: (resource?: Resource) => FormGroup<any>
) {
    const resource = committedContainer.getResourceAt(resourceType, index);
    const replaceGroup = getResourceReplaceGroup(patchForm, resourceType);

    const resourceForm = resourceFormFactory(resource);
    replaceGroup.setControl(`${index}`, resourceForm);

}

function getResourceFormArray<F extends FormGroup<any>>(form: ResourceContainerForm<any>, resourceType: ResourceType): FormArray<F> {
    switch (resourceType) {
        case 'equipment':
            return form.controls['equipments'] as FormArray<F>;
        case 'software':
            return form.controls['softwares'] as FormArray<F>;
        case 'service':
            return form.controls['services'] as FormArray<F>;
        case 'input-material':
            return form.controls['input-materials'] as FormArray<F>;
        case 'output-material':
            return form.controls['output-materials'] as FormArray<F>;
    }
}


/**
 * Abstract form service which represents a model and associated form containing
 * equipments, softwares, inputMaterials and outputMaterials.
 */
@Injectable()
export abstract class ResourceContainerFormService<
        T extends ResourceContainer & { readonly id: string; }, 
        TPatch extends ResourceContainerPatch, 
        TCreate extends TPatch = TPatch
> {
    abstract readonly context: UpdateContext<T, TPatch>;
    abstract readonly models: ModelService<T, TPatch, TCreate>;

    protected abstract getContainer$(): Observable<T>;
    protected abstract patchContainer(params: Partial<ResourceContainer>): Promise<void>;

    protected abstract getContainerForm(): ResourceContainerForm<any>;

    getResourceFormArray<F extends FormGroup<any>>(resourceType: ResourceType): FormArray<F> {
        const form = this.getContainerForm();
        return getResourceFormArray(form, resourceType);
    }

    getResourceForm<F extends FormGroup<any>>(resourceType: ResourceType, index: number): F | null {
        const formArray = this.getResourceFormArray<F>(resourceType);
        return (formArray.controls as F[])[index] || null;
    }

    async commitResourceFormAt(resourceType: ResourceType, index: number) {
        const container = await firstValueFrom(this.getContainer$());
        const committedResources = container.getResources(resourceType);
        const resourceForm = this.getResourceForm(resourceType, index);

        if (resourceForm == null) {
            // Can only commit a resource which has a form in the array.
            throw new Error(`No resource form at index ${index}`)
        }
        if (!resourceForm.valid) {
            throw new Error(`Cannot commit an invalid form`);
        }
        const newResource = resourceFormAsResource(resourceForm, resourceType);

        const resources = [...committedResources];
        resources.splice(index, 1, newResource);
        return await this.patchContainer(createContainerPatch(resourceType, resources));
    }

    async revertResourceFormAt(resourceType: ResourceType, index: number) {
        const resourceForms = this.getResourceFormArray(resourceType);
        if (resourceForms == null) {
            throw new Error('No current form');
        }
        resourceForms.removeAt(index);
        if (index !== resourceForms.length) {
            resourceForms.insert(index, await this._createResourceForm(resourceType, index));
        }
    }

    protected async _createResourceForm(resourceType: ResourceType, index: number) {
        switch (resourceType) {
            case 'equipment':
                return createEquipmentResourceForm(
                    (await firstValueFrom(this.getResourceAt$<Equipment>(resourceType, index))) || {}
                );
            case 'software':
                return createSoftwareForm(
                    (await firstValueFrom(this.getResourceAt$<Software>(resourceType, index))) || {}
                );
            case 'service':
                return serviceForm(
                    (await firstValueFrom(this.getResourceAt$<Service>(resourceType, index))) || {}
                )
            case 'input-material':
                return createInputMaterialForm(
                    (await firstValueFrom(this.getResourceAt$<InputMaterial>(resourceType, index))) || {}
                );
            case 'output-material':
                return createOutputMaterialForm(
                    (await firstValueFrom(this.getResourceAt$<OutputMaterial>(resourceType, index))) || {}
                );
        }
    }

    async deleteResourceAt(resourceType: ResourceType, index: number) {
        const container = await firstValueFrom(this.getContainer$());
        const resourceForms = this.getResourceFormArray(resourceType);
        resourceForms.removeAt(index);

        const resources = [...container.getResources(resourceType)];
        resources.splice(index, 1);
        this.patchContainer(createContainerPatch(resourceType, resources));
    }

    getResources$<TResource extends Resource>(type: ResourceType): Observable<readonly TResource[]> {
        return this.getContainer$().pipe(
            filter((p): p is T => p !== null),
            map((c) => c?.getResources<TResource>(type) || [])
        );
    }

    getResourceAt$<T extends Resource>(type: ResourceType, index: number): Observable<T> {
        return this.getResources$<T>(type).pipe(map(resources => resources[index]));
    }

    connect(): Subscription {
        return new Subscription();
    }
}
