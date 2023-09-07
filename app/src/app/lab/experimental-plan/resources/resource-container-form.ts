import { FormArray, FormGroup } from "@angular/forms";
import { EquipmentLease, EquipmentLeaseForm, equipmentLeaseForm } from "./equipment/equipment-lease";
import { InputMaterial, InputMaterialForm, createInputMaterialForm } from "./material/input/input-material";
import { OutputMaterial, OutputMaterialForm, createOutputMaterialForm } from "./material/output/output-material";
import { Service, ServiceForm, serviceForm } from "./service/service";
import { Software, SoftwareForm, createSoftwareForm } from "./software/software";
import { ResourceContainer, ResourceContainerContext, ResourceContainerPatch, ResourceContainerPatchErrors } from "./resource-container";
import { Resource, ResourceType } from "./common/resource";
import { Injectable, inject } from "@angular/core";
import { Observable, firstValueFrom, filter, map, Subscription } from "rxjs";
import { Context } from "src/app/utils/models/model-context";
import { ModelService } from "src/app/utils/models/model-service";
import { Equipment } from "../../equipment/equipment";

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

export function resourceContainerPatchFromForm(form: ResourceContainerForm<any>): ResourceContainerPatch {
    if (!form.valid) {
        throw new Error('Cannot get patch from invalid form');
    }
    return form.value as ResourceContainerPatch;
}

export function resourceContainerPatchErrorsFromForm(form: ResourceContainerForm<any>): ResourceContainerPatchErrors | null {
    if (form.valid) {
        return null;
    }
    return form.errors! as ResourceContainerPatchErrors;
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

function resourceFormFactory(resourceType: ResourceType, resource: Partial<Resource> | null) {
    switch (resourceType) {
        case 'equipment':
            return equipmentLeaseForm(resource as Partial<EquipmentLease>);
        case 'service':
            return serviceForm(resource as Partial<Service>);
        case 'software':
            return createSoftwareForm(resource as Partial<Software>);
        case 'input-material':
            return createInputMaterialForm(resource as Partial<InputMaterial>);
        case 'output-material':
            return createOutputMaterialForm(resource as Partial<OutputMaterial>);
    }
}

function pushResourceCreateForm(form: ResourceContainerForm<any>, resourceType: ResourceType) {
    const formArr = getResourceAddArray(form, resourceType);
    const createForm = resourceFormFactory(resourceType, null);
    formArr.push(createForm);
}

function popResourceCreateForm(form: ResourceContainerForm<any>, resourceType: ResourceType) {
    const formArr = getResourceAddArray(form, resourceType);
    formArr.removeAt(formArr.length - 1);
}

function setReplaceForm(form: ResourceContainerForm<any>, resourceType: ResourceType, replaceEntry: [number, Partial<Resource>]) {
    const formGroup = getResourceReplaceGroup(form, resourceType);
    const [replaceAt, committedValue] = replaceEntry;
    const updateForm = resourceFormFactory(resourceType, committedValue);
    formGroup.addControl(`${replaceAt}`, updateForm);
}

function revertReplaceForm(form: ResourceContainerForm<any>, resourceType: ResourceType, replaceEntry: [number, Partial<Resource>]) {
    const formGroup = getResourceReplaceGroup(form, resourceType);
    const [replaceAt, _] = replaceEntry;
    formGroup.removeControl(`${replaceAt}`);
}

/**
 * Abstract form service which represents a model and associated form containing
 * equipments, softwares, inputMaterials and outputMaterials.
 */
@Injectable()
export abstract class ResourceContainerFormService<
        T extends ResourceContainer & { readonly id: string; }, 
        TPatch extends ResourceContainerPatch 
> {
    readonly _context = inject(ResourceContainerContext<T,TPatch>);

    readonly container$ = this._context.committed$;
    commitContainer(patch: TPatch) {
        return this._context.commitContext(patch);
    }
    readonly form = this._context.form;

    protected abstract getContainerForm(): ResourceContainerForm<any>;

    async pushCreateResourceForm(resourceType: ResourceType) {
        return pushResourceCreateForm(this.form, resourceType)
    }

    async popCreateResourceForm(resourceType: ResourceType) {
        return popResourceCreateForm(this.form, resourceType)
    }

    async replaceResourceAt(resourceType: ResourceType, index: number) {
        const committedResources = await firstValueFrom(this._context.committedResources$(resourceType))
        if (index < 0 || index > committedResources.length) {
            throw new Error('Index out of range');
        }
        const resource = committedResources[index]
        return setReplaceForm(this.form, resourceType, [index, resource]),; 
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
