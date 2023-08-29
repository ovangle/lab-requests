import { FormArray, FormGroup } from "@angular/forms";
import { Equipment, EquipmentForm, createEquipmentResourceForm } from "./equipment/equipment";
import { Software, SoftwareForm, createSoftwareForm } from "./software/software";
import { InputMaterial, InputMaterialForm, createInputMaterialForm } from "./material/input/input-material";
import { OutputMaterial, OutputMaterialForm, createOutputMaterialForm } from "./material/output/output-material";
import { Resource, ResourceType } from "./common/resource";
import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, Observable, Subscription, filter, firstValueFrom, map } from "rxjs";
import { Service, ServiceForm, serviceForm } from "./service/service";


export class ResourceContainer {
    equipments: Equipment[];
    services: Service[];
    softwares: Software[];

    inputMaterials: InputMaterial[];
    outputMaterials: OutputMaterial[];

    constructor(params: Partial<ResourceContainer>) {
        this.equipments = (params.equipments || [])
            .map(e => new Equipment(e));
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

function createContainerPatch(resourceType: ResourceType, resources: Resource[]): Partial<ResourceContainer> {
    switch (resourceType) {
        case 'equipment':
            return { equipments: resources as Equipment[] };
        case 'service':
            return { services: resources as Service[] };
        case 'software':
            return { softwares: resources as Software[] };
        case 'input-material':
            return { inputMaterials: resources as InputMaterial[] };
        case 'output-material':
            return { outputMaterials: resources as OutputMaterial[] };
    }
}

type ResourceContainerControls = {
    equipments: FormArray<EquipmentForm>;
    services: FormArray<ServiceForm>;
    softwares: FormArray<SoftwareForm>;
    inputMaterials: FormArray<InputMaterialForm>;
    outputMaterials: FormArray<OutputMaterialForm>;
};

export type ResourceContainerForm<T extends ResourceContainerControls> = FormGroup<T>;

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

function resourceFormAsResource(form: FormGroup<any>, resourceType: ResourceType) {
    switch (resourceType) {
        case 'equipment':
            return new Equipment(form.value);
        case 'software':
            return new Software(form.value);
        case 'service':
            return new Service(form.value);
        case 'input-material':
            return new InputMaterial(form.value);
        case 'output-material':
            return new OutputMaterial(form.value);
    }
}

/**
 * Abstract form service which represents a model and associated form containing
 * equipments, softwares, inputMaterials and outputMaterials.
 */
@Injectable()
export abstract class ResourceContainerFormService<T extends ResourceContainer> {

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
