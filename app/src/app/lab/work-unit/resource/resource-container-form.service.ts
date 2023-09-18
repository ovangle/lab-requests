import { AbstractControl, FormArray, FormGroup } from "@angular/forms";
import { ResourceContainer, ResourceContainerContext, ResourceContainerPatch, ResourceContainerPatchErrors } from "./resource-container";
import { Injectable, inject } from "@angular/core";
import { Observable, firstValueFrom, filter, map, Subscription, BehaviorSubject, connectable, defer } from "rxjs";
import { Resource } from "./resource";
import { ExperimentalPlanFormPaneControlService } from "../../experimental-plan/experimental-plan-form-pane-control.service";
import { EquipmentLeaseForm, EquipmentLease, equipmentLeaseForm } from "../resources/equipment/equipment-lease";
import { InputMaterialForm, InputMaterial, createInputMaterialForm } from "../resources/material/input/input-material";
import { OutputMaterialForm, OutputMaterial, createOutputMaterialForm } from "../resources/material/output/output-material";
import { ServiceForm, Service, serviceForm } from "../resources/service/service";
import { SoftwareForm, Software, createSoftwareForm } from "../resources/software/software";
import { ResourceType, ALL_RESOURCE_TYPES } from "./resource-type";

type ReplaceResourceGroup<T, TForm extends FormGroup<any>> = FormGroup<{[k: string]: AbstractControl<T | null>}>;

function replaceResourceForm<T, TForm extends FormGroup<any>>(): ReplaceResourceGroup<T, TForm> {
    return new FormGroup({});
}

function initReplaceResourceAt<T extends Resource, TForm extends FormGroup<any>>(replaceForm: ReplaceResourceGroup<T, TForm>, committed: Partial<T>, index: number) {
    const form = resourceFormFactory(committed.type!, committed);
    replaceForm.addControl(`${index}`, form);
}

function clearReplaceResourceAt<T extends Resource, TForm extends FormGroup<any>>(replaceForm: ReplaceResourceGroup<T, TForm>, index: number) {
    replaceForm.removeControl(`${index}`);
}

function getReplaceResourceAt<T extends Resource, TForm extends FormGroup<any>>(replaceForm: ReplaceResourceGroup<T, TForm>, index: number): TForm | null {
    return replaceForm.get(`${index}`) as TForm | null;
}

export type ResourceContainerFormControls = {
    addEquipments: FormArray<EquipmentLeaseForm>;
    replaceEquipments: ReplaceResourceGroup<EquipmentLease, EquipmentLeaseForm>;

    addServices: FormArray<ServiceForm>;
    replaceServices: ReplaceResourceGroup<Service, ServiceForm>;

    addSoftwares: FormArray<SoftwareForm>;
    replaceSoftwares: ReplaceResourceGroup<Software, SoftwareForm>;

    addInputMaterials: FormArray<InputMaterialForm>;
    replaceInputMaterials: ReplaceResourceGroup<InputMaterial, InputMaterialForm>;

    addOutputMaterials: FormArray<OutputMaterialForm>;
    replaceOutputMaterials: ReplaceResourceGroup<OutputMaterial, OutputMaterialForm>;
};

export function resourceContainerFormControls(): ResourceContainerFormControls {
    return {
        addEquipments: new FormArray<EquipmentLeaseForm>([]),
        replaceEquipments: replaceResourceForm<EquipmentLease, EquipmentLeaseForm>(),

        addServices: new FormArray<ServiceForm>([]),
        replaceServices: replaceResourceForm<Service, ServiceForm>(),

        addSoftwares: new FormArray<SoftwareForm>([]),
        replaceSoftwares: replaceResourceForm<Software, SoftwareForm>(),

        addInputMaterials: new FormArray<InputMaterialForm>([]),
        replaceInputMaterials: replaceResourceForm<InputMaterial, InputMaterialForm>(),

        addOutputMaterials: new FormArray<OutputMaterialForm>([]),
        replaceOutputMaterials: replaceResourceForm<OutputMaterial, OutputMaterialForm>()
    }
}

export type ResourceContainerForm<TPatch extends ResourceContainerPatch = ResourceContainerPatch> = FormGroup<ResourceContainerFormControls>;

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

function getResourceAddArray<TForm extends FormGroup<any>>(form: ResourceContainerForm<any>, resourceType: ResourceType): FormArray<TForm> {
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

function getResourceReplaceGroup(form: ResourceContainerForm<any>, resourceType: ResourceType): ReplaceResourceGroup<any, any> {
    switch (resourceType) {
        case 'equipment':
            return form.controls['replaceEquipments'];
        case 'software':
            return form.controls['replaceSoftwares'];
        case 'service':
            return form.controls['replaceServices']; 
        case 'input-material':
            return form.controls['replaceInputMaterials'];
        case 'output-material':
            return form.controls['replaceOutputMaterials'];
    }
}

function resourceFormFactory(resourceType: ResourceType, resource: Partial<Resource>) {
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
    const createForm = resourceFormFactory(resourceType, {});
    formArr.push(createForm);
}

function popResourceCreateForm(form: ResourceContainerForm<any>, resourceType: ResourceType) {
    const formArr = getResourceAddArray(form, resourceType);
    formArr.removeAt(formArr.length - 1);
}


function getReplaceFormAt(form: ResourceContainerForm<any>, resourceType: ResourceType, index: number): FormGroup<any> | null { 
    const formGroup = getResourceReplaceGroup(form, resourceType);
    return formGroup.get(`${index}`) as FormGroup<any> | null
}

function setReplaceForm(form: ResourceContainerForm<any>, resourceType: ResourceType, replaceEntry: [number, Partial<Resource>]) {
    const formGroup = getResourceReplaceGroup(form, resourceType);
    const [replaceAt, committedValue] = replaceEntry;
    const updateForm = resourceFormFactory(resourceType, committedValue);
    formGroup.addControl(`${replaceAt}`, updateForm);
}

function clearReplaceForm(form: ResourceContainerForm<any>, resourceType: ResourceType, index: number) {
    const formGroup = getResourceReplaceGroup(form, resourceType);
    const key = `${index}`;
    if (!formGroup.get(key)) {
        throw new Error('cannot clear non-existent form')
    }
    formGroup.removeControl(key);
}

function revertReplaceFormAt(form: ResourceContainerForm<any>, resourceType: ResourceType, index: number) {
    const formGroup: FormGroup<any> = getResourceReplaceGroup(form, resourceType);
    formGroup.removeControl(`${index}`)
}

/**
 * Abstract form service which represents a model and associated form containing
 * equipments, softwares, inputMaterials and outputMaterials.
 */
@Injectable()
export abstract class ResourceContainerFormService {
    readonly _context = inject(ResourceContainerContext<any,any>);

    readonly container$ = this._context.committed$;

    readonly patchValue$: Observable<ResourceContainerPatch> = defer(() => this.form.statusChanges.pipe( 
        filter((status) => status === 'VALID'),
        map(() => resourceContainerPatchFromForm(this.form))
    ));

    abstract readonly form: ResourceContainerForm;

    async patchFromContainerPatch(patch: ResourceContainerPatch) {
        return this._context.patchFromContainerPatch(patch);
    }

    async commit() {
        if (!this.form.valid) {
            throw new Error('Cannot commit invalid form');
        }
        const patch = resourceContainerPatchFromForm(this.form);
        return await this._context.commit(patch);
    }

    async initResourceForm(resourceType: ResourceType, index: number | 'create'): Promise<void> { 
        console.log('initializing', resourceType, 'form', index);
        if (index === 'create') {
            return this.pushResourceCreateForm(resourceType);
        }
        const replaceGroup = getResourceReplaceGroup(this.form, resourceType);
        const committed = await firstValueFrom(this.getResourceAt$(resourceType, index));

        console.log('initialized', resourceType, 'form', index);
        return initReplaceResourceAt(replaceGroup, committed, index);
    }

    async clearResourceForm(resourceType: ResourceType, index: number | 'create'): Promise<void> {
        console.log('clearing', resourceType, 'form', index);
        if (index == 'create') {
            return this.popResourceCreateForm(resourceType);
        }
        const replaceGroup = getResourceReplaceGroup(this.form, resourceType);
        return clearReplaceResourceAt(replaceGroup, index);
    }

    getResourceForm(resourceType: ResourceType, index: number | 'create'): FormGroup<any> | null {
        if (index === 'create') {
            // This is a create form
            const addArr = getResourceAddArray(this.form, resourceType); 
            return (addArr.controls[0] as FormGroup<any>) || null; 
        } else {
            return getReplaceFormAt(this.form, resourceType, index) || null;
        }
    }


    /**
     * Pushes a create form onto the reosurce
     * @param resourceType 
     * @returns 
     */
    async pushResourceCreateForm(resourceType: ResourceType) {
        return pushResourceCreateForm(this.form, resourceType)
    }

    async popResourceCreateForm(resourceType: ResourceType) {
        return popResourceCreateForm(this.form, resourceType)
    }

    async setResourceUpdateAt(resourceType: ResourceType, index: number) {
        const committedResources = await firstValueFrom(this._context.committedResources$(resourceType))
        if (index < 0 || index > committedResources.length) {
            throw new Error('Index out of range');
        }
        const resource = committedResources[index]
        return setReplaceForm(this.form, resourceType, [index, resource]); 
    }

    async clearResourceUpdateAt(resourceType: ResourceType, index: number) {
        return clearReplaceForm(this.form, resourceType, index);
    }

    async deleteResourceAt(resourceType: ResourceType, index: number) {
        throw new Error('Not implemented')
        //const container = await firstValueFrom(this.getContainer$());
        //const resourceForms = this.getResourceFormArray(resourceType);
        //resourceForms.removeAt(index);

        //const resources = [...container.getResources(resourceType)];
        //resources.splice(index, 1);
        //this.patchContainer(createContainerPatch(resourceType, resources));
    }

    getResources$<TResource extends Resource>(type: ResourceType): Observable<readonly TResource[]> {
        return this.container$.pipe(
            filter((p): p is ResourceContainer => p !== null),
            map((c) => c?.getResources<TResource>(type) || [])
        );
    }

    getResourceAt$<T extends Resource>(type: ResourceType, index: number): Observable<T> {
        return this.getResources$<T>(type).pipe(map(resources => resources[index]));
    }
}