import { FormArray, FormGroup } from "@angular/forms";
import { EquipmentLease, EquipmentLeaseForm, equipmentLeaseForm } from "./equipment/equipment-lease";
import { InputMaterial, InputMaterialForm, createInputMaterialForm } from "./material/input/input-material";
import { OutputMaterial, OutputMaterialForm, createOutputMaterialForm } from "./material/output/output-material";
import { Service, ServiceForm, serviceForm } from "./service/service";
import { Software, SoftwareForm, createSoftwareForm } from "./software/software";
import { ResourceContainer, ResourceContainerContext, ResourceContainerPatch, ResourceContainerPatchErrors } from "./resource-container";
import { RESOURCE_TYPE_NAMES, Resource, ResourceType } from "./common/resource";
import { Injectable, inject } from "@angular/core";
import { Observable, firstValueFrom, filter, map, Subscription, BehaviorSubject, connectable, defer } from "rxjs";
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
            return form.controls['replaceServices']  as FormGroup<{[k: string]: FormGroup<any>}>;
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
    _commitContainer(patch: ResourceContainerPatch) {
        return this._context.commitContext(patch);
    }

    readonly patchValue$: Observable<ResourceContainerPatch> = defer(() => this.form.statusChanges.pipe( 
        filter((status) => status === 'VALID'),
        map(() => resourceContainerPatchFromForm(this.form))
    ));

    abstract readonly form: ResourceContainerForm;

    patchFromContainerPatch(patch: ResourceContainerPatch) {
        return this._context.patchFromContainerPatch(patch);
    }

    async commit() {
        if (!this.form.valid) {
            throw new Error('Cannot commit invalid form');
        }
        const patch = resourceContainerPatchFromForm(this.form);
        return await this._commitContainer(patch);
    }


    readonly resourceCountsSubject = new BehaviorSubject<Partial<Record<ResourceType, number>>>({});

    connect() {
        const syncCountsSubscription = this.container$.pipe(
            map(container => {
                const resourceTypes = Object.keys(RESOURCE_TYPE_NAMES) as ResourceType[];
                const counts: [ResourceType, number][] = resourceTypes.map(t => [t, container.countResources(t)]) 
                return Object.fromEntries(counts); 
            })
        ).subscribe(this.resourceCountsSubject);

        return new Subscription(() => {
            this.resourceCountsSubject.complete();
        });
    }

    getCommitedResourceCount(resourceType: ResourceType) {
        const resourceCounts = this.resourceCountsSubject.value;
        return resourceCounts[resourceType] || -1;
    }

    getResourceForm(resourceType: ResourceType, index: number): FormGroup<any> | null {
        const count = this.getCommitedResourceCount(resourceType);
        if (index >= count) {
            // This is a create form
            const addArr = getResourceAddArray(this.form, resourceType); 
            return (addArr.controls[index - count] as FormGroup<any>) || null; 
        } else if (index >= 0) {
            return getReplaceFormAt(this.form, resourceType, index) || null;
        } else {
            return null;
        }
    }

    isCreateFormAt(resourceType: ResourceType, index: number) {
        const count = this.getCommitedResourceCount(resourceType);
        return index >= count;
    }

    /**
     * Pushes a create form onto the reosurce
     * @param resourceType 
     * @returns 
     */
    async pushResourceForm(resourceType: ResourceType) {
        return pushResourceCreateForm(this.form, resourceType)
    }

    async popResourceForm(resourceType: ResourceType) {
        return popResourceCreateForm(this.form, resourceType)
    }

    async replaceResourceAt(resourceType: ResourceType, index: number) {
        const committedResources = await firstValueFrom(this._context.committedResources$(resourceType))
        if (index < 0 || index > committedResources.length) {
            throw new Error('Index out of range');
        }
        const resource = committedResources[index]
        return setReplaceForm(this.form, resourceType, [index, resource]); 
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