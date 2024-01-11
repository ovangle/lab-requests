import { Injectable, inject } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { Observable, defer, filter, firstValueFrom, map } from 'rxjs';
import { Resource } from './resource';
import {
  ResourceContainer,
  ResourceContainerContext,
  ResourceContainerPatch,
  resourceContainerAttr,
} from './resource-container';
import { ALL_RESOURCE_TYPES, ResourceType } from './resource-type';
import { EquipmentLease } from '../lab-resources/equipment-lease/equipment-lease';
import {
  EquipmentLeaseForm,
  equipmentLeaseForm,
  EquipmentLeaseFormErrors,
} from '../lab-resources/equipment-lease/equipment-lease-form.component';
import { InputMaterial } from '../lab-resources/input-material/input-material';
import {
  InputMaterialForm,
  inputMaterialForm,
  InputMaterialFormErrors,
} from '../lab-resources/input-material/input-material-resource-form.component';
import {
  OutputMaterialForm,
  createOutputMaterialForm,
  OutputMaterialFormErrors,
} from '../lab-resources/output-material/output-material-resource-form.component';
import {
  SoftwareForm,
  softwareForm,
  SoftwareFormErrors,
} from '../lab-resources/software-lease/software-resource-form.component';
import { Software } from '../software/software';
import { OutputMaterial } from '../lab-resources/output-material/output-material';

type ReplaceResourceGroup<
  T extends Resource,
  TForm extends FormGroup<any> = FormGroup<any>,
> = FormGroup<{ [k: string]: TForm }>;

function replaceResourceForm<
  T extends Resource,
  TForm extends FormGroup<any> = FormGroup<any>,
>(): ReplaceResourceGroup<T, TForm> {
  return new FormGroup({});
}

export type ResourceContainerFormControls = {
  addEquipments: FormArray<EquipmentLeaseForm>;
  replaceEquipments: ReplaceResourceGroup<EquipmentLease, EquipmentLeaseForm>;

  addSoftwares: FormArray<SoftwareForm>;
  replaceSoftwares: ReplaceResourceGroup<SoftwareLease, SoftwareLeaseForm>;

  addInputMaterials: FormArray<InputMaterialForm>;
  replaceInputMaterials: ReplaceResourceGroup<InputMaterial, InputMaterialForm>;

  addOutputMaterials: FormArray<OutputMaterialForm>;
  replaceOutputMaterials: ReplaceResourceGroup<
    OutputMaterial,
    OutputMaterialForm
  >;
};

export function resourceContainerFormControls(): ResourceContainerFormControls {
  return {
    addEquipments: new FormArray<EquipmentLeaseForm>([]),
    replaceEquipments: replaceResourceForm<
      EquipmentLease,
      EquipmentLeaseForm
    >(),

    addTasks: new FormArray<TaskForm>([]),
    replaceTasks: replaceResourceForm<Task, TaskForm>(),

    addSoftwares: new FormArray<SoftwareForm>([]),
    replaceSoftwares: replaceResourceForm<Software, SoftwareForm>(),

    addInputMaterials: new FormArray<InputMaterialForm>([]),
    replaceInputMaterials: replaceResourceForm<
      InputMaterial,
      InputMaterialForm
    >(),

    addOutputMaterials: new FormArray<OutputMaterialForm>([]),
    replaceOutputMaterials: replaceResourceForm<
      OutputMaterial,
      OutputMaterialForm
    >(),
  };
}

export type ResourceContainerForm = FormGroup<ResourceContainerFormControls>;

export function resourceContainerPatchFromForm(form: ResourceContainerForm) {
  if (!form.valid) {
    throw new Error('Cannot get patch from invalid form');
  }

  const patch: Partial<ResourceContainerPatch<any>> = {};
  for (const resourceType of ALL_RESOURCE_TYPES) {
    const slices: any[] = [];
    const addArray = getResourceAddArray(form, resourceType);
    if (addArray.length > 0) {
      slices.push({
        start: 'append',
        items: addArray.value.map((value) => value as Resource),
      });
    }

    const replaceGroup = getResourceReplaceGroup(form, resourceType);
    Object.entries(replaceGroup.controls).forEach(([sliceName, form]) => {
      const start = Number.parseInt(sliceName);
      slices.push({ start, end: start + 1, items: [form.value] });
    });
    patch[resourceContainerAttr(resourceType)] = slices;
  }
  return patch as ResourceContainerPatch<any>;
}

export function resourceContainerPatchErrorsFromForm(
  form: ResourceContainerForm,
): ResourceContainerFormErrors | null {
  if (form.valid) {
    return null;
  }
  return form.errors! as ResourceContainerFormErrors;
}

function getResourceAddArray<TForm extends FormGroup<any>>(
  form: ResourceContainerForm,
  resourceType: ResourceType,
): FormArray<TForm> {
  switch (resourceType) {
    case 'equipment-lease':
      return form.controls['addEquipments'] as FormArray<any>;
    case 'software-lease':
      return form.controls['addSoftwares'] as FormArray<any>;
    case 'input-material':
      return form.controls['addInputMaterials'] as FormArray<any>;
    case 'output-material':
      return form.controls['addOutputMaterials'] as FormArray<any>;
  }
}

function getResourceReplaceGroup<T extends Resource>(
  form: ResourceContainerForm,
  resourceType: T['type'] & ResourceType,
): ReplaceResourceGroup<T, any> {
  switch (resourceType) {
    case 'equipment-lease':
      return form.controls['replaceEquipments'];
    case 'software-lease':
      return form.controls['replaceSoftwares'];
    case 'input-material':
      return form.controls['replaceInputMaterials'];
    case 'output-material':
      return form.controls['replaceOutputMaterials'];
    default:
      throw new Error(`unrecognised resource type ${resourceType}`);
  }
}

function resourceFormFactory<TResource extends Resource>(
  resourceType: ResourceType & TResource['type'],
): FormGroup<any> {
  switch (resourceType) {
    case 'equipment-lease':
      return equipmentLeaseForm();
    case 'software-lease':
      return softwareForm();
    case 'input-material':
      return inputMaterialForm();
    case 'output-material':
      return createOutputMaterialForm();
    default:
      throw new Error(`Unexpected resource type ${resourceType}`);
  }
}

function pushResourceCreateForm(
  form: ResourceContainerForm,
  resourceType: ResourceType,
) {
  const formArr = getResourceAddArray(form, resourceType);
  const createForm = resourceFormFactory(resourceType);
  formArr.push(createForm);
}

function popResourceCreateForm(
  form: ResourceContainerForm,
  resourceType: ResourceType,
) {
  const formArr = getResourceAddArray(form, resourceType);
  formArr.removeAt(formArr.length - 1);
}

function getReplaceFormAt(
  form: ResourceContainerForm,
  resourceType: ResourceType,
  index: number,
): FormGroup<any> | null {
  const formGroup = getResourceReplaceGroup(form, resourceType);
  return formGroup.get(`${index}`) as FormGroup<any> | null;
}

function initReplaceForm(
  form: ResourceContainerForm,
  resourceType: ResourceType,
  replaceEntry: [number, Partial<Resource>],
) {
  const formGroup = getResourceReplaceGroup(form, resourceType);
  const [replaceAt, committedValue] = replaceEntry;
  const updateForm = resourceFormFactory(resourceType);
  updateForm.patchValue(committedValue);
  formGroup.addControl(`${replaceAt}`, updateForm);
}

function clearReplaceForm(
  form: ResourceContainerForm,
  resourceType: ResourceType,
  index: number,
) {
  const formGroup = getResourceReplaceGroup(form, resourceType);
  const key = `${index}`;
  if (!formGroup.get(key)) {
    throw new Error('cannot clear non-existent form');
  }
  formGroup.removeControl(key);
}

function revertReplaceFormAt(
  form: ResourceContainerForm,
  resourceType: ResourceType,
  index: number,
) {
  const formGroup: FormGroup<any> = getResourceReplaceGroup(form, resourceType);
  formGroup.removeControl(`${index}`);
}

export interface ResourceContainerFormErrors {
  addEquipments?: (EquipmentLeaseFormErrors | null)[];
  replaceEquipments?: { [k: string]: EquipmentLeaseFormErrors };

  addSoftwares?: (SoftwareFormErrors | null)[];
  replaceSoftwares?: { [k: string]: SoftwareFormErrors };

  addInputMaterials?: (InputMaterialFormErrors | null)[];
  replaceInputMaterials?: { [k: string]: InputMaterialFormErrors };

  addOutputMaterials?: (OutputMaterialFormErrors | null)[];
  replaceOutputMaterials?: { [k: string]: OutputMaterialFormErrors };
}
/**
 * Abstract form service which represents a model and associated form containing
 * equipments, softwares, inputMaterials and outputMaterials.
 */
@Injectable()
export abstract class ResourceContainerFormService<
  T extends ResourceContainer = ResourceContainer,
> {
  readonly _context = inject(ResourceContainerContext<any, any>);

  readonly container$ = this._context.committed$;

  readonly patchValue$: Observable<ResourceContainerPatch<T>> = defer(() =>
    this.form.statusChanges.pipe(
      filter((status) => status === 'VALID'),
      map(() => resourceContainerPatchFromForm(this.form)),
    ),
  );

  abstract readonly form: ResourceContainerForm;

  async patchFromContainerPatch(patch: ResourceContainerPatch<T>) {
    return this._context.patchFromContainerPatch(patch);
  }

  async commit() {
    if (!this.form.valid) {
      throw new Error('Cannot commit invalid form');
    }
    const patch = resourceContainerPatchFromForm(this.form);
    return await this._context.commit(patch);
  }

  async initResourceForm(
    resourceType: ResourceType,
    index: number | 'create',
  ): Promise<void> {
    if (index === 'create') {
      return this.pushResourceCreateForm(resourceType);
    }
    const committed = await firstValueFrom(
      this.getResourceAt$(resourceType, index),
    );
    return initReplaceForm(this.form, resourceType, [index, committed]);
  }

  async clearResourceForm(
    resourceType: ResourceType,
    index: number | 'create',
  ): Promise<void> {
    if (index == 'create') {
      return this.popResourceCreateForm(resourceType);
    }
    return clearReplaceForm(this.form, resourceType, index);
  }

  getResourceForm(
    resourceType: ResourceType,
    index: number | 'create',
  ): FormGroup<any> | null {
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
    return pushResourceCreateForm(this.form, resourceType);
  }

  async popResourceCreateForm(resourceType: ResourceType) {
    return popResourceCreateForm(this.form, resourceType);
  }

  async setResourceUpdateAt(resourceType: ResourceType, index: number) {
    const committedResources = await firstValueFrom(
      this._context.committedResources$(resourceType),
    );
    if (index < 0 || index > committedResources.length) {
      throw new Error('Index out of range');
    }
    const resource = committedResources[index];
    return initReplaceForm(this.form, resourceType, [index, resource]);
  }

  async clearResourceUpdateAt(resourceType: ResourceType, index: number) {
    return clearReplaceForm(this.form, resourceType, index);
  }

  async deleteResourceAt(resourceType: ResourceType, index: number) {
    throw new Error('Not implemented');
    //const container = await firstValueFrom(this.getContainer$());
    //const resourceForms = this.getResourceFormArray(resourceType);
    //resourceForms.removeAt(index);

    //const resources = [...container.getResources(resourceType)];
    //resources.splice(index, 1);
    //this.patchContainer(createContainerPatch(resourceType, resources));
  }

  getResources$<TResource extends Resource>(
    type: ResourceType,
  ): Observable<readonly TResource[]> {
    return this.container$.pipe(
      filter((p): p is ResourceContainer => p !== null),
      map((c) => c?.getResources<TResource>(type) || []),
    );
  }

  getResourceAt$<T extends Resource>(
    type: ResourceType,
    index: number,
  ): Observable<T> {
    return this.getResources$<T>(type).pipe(
      map((resources) => resources[index]),
    );
  }
}
