import { Injectable, inject } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { BehaviorSubject, NEVER, Observable, defer, filter, firstValueFrom, map, of } from 'rxjs';
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
import { OutputMaterial } from '../lab-resources/output-material/output-material';
import { SoftwareLease } from '../lab-resources/software-lease/software-lease';
import { SoftwareLeaseForm, SoftwareLeaseFormErrors, softwareLeaseForm } from '../lab-resources/software-lease/software-resource-form.component';

type ReplaceResourceGroup<
  T extends Resource,
  TForm extends FormGroup<any> = FormGroup<any>,
> = FormGroup<{ [ k: string ]: TForm }>;

function replaceResourceForm<
  T extends Resource,
  TForm extends FormGroup<any> = FormGroup<any>,
>(): ReplaceResourceGroup<T, TForm> {
  return new FormGroup({});
}

export type ResourceContainerFormControls = {
  addEquipments: FormArray<EquipmentLeaseForm>;
  replaceEquipments: ReplaceResourceGroup<EquipmentLease, EquipmentLeaseForm>;

  addSoftwares: FormArray<SoftwareLeaseForm>;
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

    addSoftwares: new FormArray<SoftwareLeaseForm>([]),
    replaceSoftwares: replaceResourceForm<SoftwareLease, SoftwareLeaseForm>(),

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
export function isResourceContainerForm(obj: unknown): obj is ResourceContainerForm {
  if (!(obj instanceof FormGroup)) {
    return false;
  }
  const keys = new Set(Object.keys(obj.controls));

  return ALL_RESOURCE_TYPES.every((t: ResourceType) => {
    return getResourceAddArray(obj as any, t) != null
      && getResourceReplaceGroup(obj as any, t) != null;
  })
}

export function resourceContainerPatchFromForm(form: ResourceContainerForm) {
  if (!form.valid) {
    throw new Error('Cannot get patch from invalid form');
  }

  const patch: Partial<ResourceContainerPatch> = {};
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
    Object.entries(replaceGroup.controls).forEach(([ sliceName, form ]) => {
      const start = Number.parseInt(sliceName);
      slices.push({ start, end: start + 1, items: [ form.value ] });
    });
    patch[ resourceContainerAttr(resourceType) ] = slices;
  }
  return patch as ResourceContainerPatch;
}

function getResourceAddArray<TForm extends FormGroup<any>>(
  form: ResourceContainerForm,
  resourceType: ResourceType,
): FormArray<TForm> {
  switch (resourceType) {
    case 'equipment-lease':
      return form.controls[ 'addEquipments' ] as FormArray<any>;
    case 'software-lease':
      return form.controls[ 'addSoftwares' ] as FormArray<any>;
    case 'input-material':
      return form.controls[ 'addInputMaterials' ] as FormArray<any>;
    case 'output-material':
      return form.controls[ 'addOutputMaterials' ] as FormArray<any>;
  }
}

function getResourceReplaceGroup<T extends Resource>(
  form: ResourceContainerForm,
  resourceType: T[ 'type' ] & ResourceType,
): ReplaceResourceGroup<T, any> {
  switch (resourceType) {
    case 'equipment-lease':
      return form.controls[ 'replaceEquipments' ];
    case 'software-lease':
      return form.controls[ 'replaceSoftwares' ];
    case 'input-material':
      return form.controls[ 'replaceInputMaterials' ];
    case 'output-material':
      return form.controls[ 'replaceOutputMaterials' ];
    default:
      throw new Error(`unrecognised resource type ${resourceType}`);
  }
}

function resourceFormFactory<TResource extends Resource>(
  resourceType: ResourceType & TResource[ 'type' ],
): FormGroup<any> {
  switch (resourceType) {
    case 'equipment-lease':
      return equipmentLeaseForm();
    case 'software-lease':
      return softwareLeaseForm();
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
  replaceEntry: [ number, Partial<Resource> ],
) {
  const formGroup = getResourceReplaceGroup(form, resourceType);
  const [ replaceAt, committedValue ] = replaceEntry;
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

export type GetResourceAtFn<T extends Resource> = (resourceType: T[ 'type' ], index: number) => T | undefined;

/**
 * Root service so that resource create/update forms (which display in the scaffold form pane)
 * equipments, softwares, inputMaterials and outputMaterials.
 */
@Injectable({ providedIn: 'root' })
export abstract class ResourceContainerFormService {
  context: ResourceContainerContext | undefined;
  form: ResourceContainerForm | undefined;

  checkHasForm() {
    if (!this.form || this.context === undefined) {
      throw new Error('Resource form service not initialized');
    }
  }

  setupForm(
    form: ResourceContainerForm,
    context: ResourceContainerContext
  ) {
    if (this.form) {
      throw new Error('Cannot initialize resource form service. Previous form not destroyed');
    }
    this.form = form;
    this.context = context;
  }

  teardownForm() {
    this.checkHasForm();
    this.form = this.context = undefined;
  }

  async initResourceForm(
    resourceType: ResourceType,
    index: number | 'create',
  ): Promise<void> {
    this.checkHasForm();
    if (index === 'create') {
      return this.pushResourceCreateForm(resourceType);
    }
    const committed = await this.context!.getResourceAt(resourceType, index);
    return initReplaceForm(this.form!, resourceType, [ index, committed || {} ]);
  }

  async clearResourceForm(
    resourceType: ResourceType,
    index: number | 'create',
  ): Promise<void> {
    this.checkHasForm();
    if (index == 'create') {
      return this.popResourceCreateForm(resourceType);
    }
    return clearReplaceForm(this.form!, resourceType, index);
  }

  getResourceForm(
    resourceType: ResourceType,
    index: number | 'create',
  ): FormGroup<any> | null {
    if (index === 'create') {
      // This is a create form
      const addArr = getResourceAddArray(this.form!, resourceType);
      return (addArr.controls[ 0 ] as FormGroup<any>) || null;
    } else {
      return getReplaceFormAt(this.form!, resourceType, index) || null;
    }
  }

  /**
   * Pushes a create form onto the reosurce
   * @param resourceType
   * @returns
   */
  pushResourceCreateForm(resourceType: ResourceType) {
    return pushResourceCreateForm(this.form!, resourceType);
  }

  popResourceCreateForm(resourceType: ResourceType) {
    return popResourceCreateForm(this.form!, resourceType);
  }

  clearResourceUpdateAt(resourceType: ResourceType, index: number) {
    return clearReplaceForm(this.form!, resourceType, index);
  }
}
