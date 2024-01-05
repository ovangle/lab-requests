import {
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Resource, ResourceParams } from '../../resource/resource';
import { collectFieldErrors } from 'src/app/utils/forms/validators';
import { Observable, filter, map, startWith } from 'rxjs';
import {
  ResourceFileAttachment,
  resourceFileAttachmentFromJson,
  resourceFileAttachmentToJson,
} from '../../resource/file-attachment/file-attachment';
import {
  CostEstimate,
  costEstimateFromJson,
  costEstimateToJson,
} from 'src/app/uni/research/funding/cost-estimate/cost-estimate';

export interface TaskParams extends ResourceParams {
  readonly name: string;
  readonly description: string;

  readonly supplier: 'researcher' | 'technician' | 'other';
  readonly externalSupplierDescription: string;

  readonly costEstimate: CostEstimate | null;
}

/**
 * A service represents a task performed by a lab tech, or
 * contracted out to a third party which is required to complete
 * the research plan.
 *
 */
export class Task extends Resource<TaskParams> {
  override readonly type = 'task';

  readonly name: string;
  readonly description: string;

  readonly supplier: 'researcher' | 'technician' | 'other';
  readonly externalSupplierDescription: string;

  readonly costEstimate: CostEstimate | null;

  constructor(params: TaskParams) {
    super(params);

    if (!params.name) {
      throw new Error('A service name is required');
    }
    this.name = params.name;
    this.description = params.description || '';

    if (
      !['researcher', 'technician', 'external'].includes(params.supplier || '')
    ) {
      throw new Error('Invalid service. Expected a supplier');
    }

    this.supplier = params.supplier!;
    this.externalSupplierDescription = params.externalSupplierDescription || '';
    this.costEstimate = params.costEstimate || null;
  }
}

export function taskFromJson(json: { [k: string]: any }): Task {
  const attachments = (json['attachments'] || []).map(
    resourceFileAttachmentFromJson,
  );

  return new Task({
    containerId: json['containerId'],
    id: json['id'],
    index: json['index'],
    name: json['name'],
    description: json['description'],
    supplier: json['supplier'],
    externalSupplierDescription: json['externalSupplierDescription'],
    costEstimate: json['costEstimate']
      ? costEstimateFromJson(json['costEstimate'])
      : null,
    attachments,
  });
}

export function taskToJson(task: TaskParams) {
  return {
    containerId: task.containerId,
    id: task.id,
    index: task.index,

    name: task.name,
    description: task.description,
    supplier: task.supplier,
    externalSupplierDescription: task.externalSupplierDescription,
    costEstimate: task.costEstimate && costEstimateToJson(task.costEstimate),
  };
}

export type TaskForm = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
  supplier: FormControl<'technician' | 'researcher' | 'other'>;
  externalSupplierDescription: FormControl<string>;

  isUniversitySupplied: FormControl<boolean>;
  estimatedCost: FormControl<number>;
}>;

export function serviceForm(task: Partial<Task>): TaskForm {
  return new FormGroup(
    {
      name: new FormControl(task.name || '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      description: new FormControl(task.description || '', {
        nonNullable: true,
      }),
      supplier: new FormControl<'researcher' | 'technician' | 'other'>(
        'researcher',
        { nonNullable: true },
      ),
      externalSupplierDescription: new FormControl<string>('', {
        nonNullable: true,
      }),
      isUniversitySupplied: new FormControl(
        !!task.costEstimate?.isUniversitySupplied,
        { nonNullable: true },
      ),
      estimatedCost: new FormControl(task.costEstimate?.perUnitCost || 0, {
        nonNullable: true,
      }),
    },
    {
      asyncValidators: [(c) => collectFieldErrors(c as TaskForm)],
    },
  );
}

export type TaskFormErrors = ValidationErrors & {
  name: { required: string | null };
};

export function taskFormErrors(
  form: TaskForm,
): Observable<TaskFormErrors | null> {
  return form.statusChanges.pipe(
    startWith(form.status),
    filter((status) => status != 'PENDING'),
    map(() => form.errors as TaskFormErrors),
  );
}
