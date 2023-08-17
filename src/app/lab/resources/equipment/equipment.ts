import { ResourceStorage, ResourceStorageForm, createResourceStorageForm } from "../common/storage/resource-storage";
import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { ResourceDisposal, ResourceDisposalForm, createResourceDisposalForm } from "../common/disposal/resource-disposal";
import { Resource } from "../common/resource";
import { EquipmentSchema } from "./schema/equipment-schema";

export class Equipment implements Resource {
    readonly type = 'equipment';
    schema: EquipmentSchema;

    name: string;
    comments: string;

    numRequested: number;

    // The researcher has previously completed all required training for the equipment
    hasRequiredTraining: boolean;

    // The researcher is requesting additional instruction in the use of this equipment
    requestsInstruction: boolean;

    setupInstructions: string;

    isUniversitySupplied: boolean;

    constructor(r: {readonly schema: EquipmentSchema} & Partial<Equipment>) {
        this.schema = r.schema;
        this.name = r?.name || '';
        this.comments = r?.comments || '';

        this.numRequested = typeof r.numRequested === 'number' ? r.numRequested : 1;

        this.hasRequiredTraining = r.hasRequiredTraining || false;
        this.requestsInstruction = r.requestsInstruction || false;

        this.setupInstructions = r.setupInstructions || '';

        this.isUniversitySupplied = !!r.isUniversitySupplied;
    }
}


export type EquipmentForm = FormGroup<{
    schema: FormControl<EquipmentSchema | null>,

    name: FormControl<string>;
    comments: FormControl<string>;

    hasRequiredTraining: FormControl<boolean>;
    requestsInstruction: FormControl<boolean>;

    numRequested: FormControl<number>;
    isUniversitySupplied: FormControl<boolean>;

    setupInstructions: FormControl<string>;

    // radioactivity: ResourceRadiationForm;
    // storage: ResourceStorageForm;
    // disposal: ResourceDisposalForm;
    // consumables: FormArray<EquipmentConsumableForm>
}>

export function isEquipmentResourceForm(obj: any): obj is EquipmentForm {
    return obj instanceof FormGroup;
}

export function createEquipmentResourceForm(r: Partial<Equipment>): EquipmentForm {
    const schema = r?.schema;
    return new FormGroup({
        schema: new FormControl<EquipmentSchema | null>(null, {
            validators: Validators.required
        }),
        name: new FormControl<string>(r.name || '', {nonNullable: true}),
        comments: new FormControl<string>(r.comments || '', {nonNullable: true}),

        hasRequiredTraining: new FormControl<boolean>(r.hasRequiredTraining || false, {nonNullable: true}),
        requestsInstruction: new FormControl<boolean>(r.requestsInstruction || false, {nonNullable: true}),

        numRequested: new FormControl<number>(
            typeof r.numRequested === 'number' ? r.numRequested : 1,
            {nonNullable: true}
        ),
        isUniversitySupplied: new FormControl<boolean>(!!r.isUniversitySupplied, {nonNullable: true}),

        setupInstructions: new FormControl<string>('', {nonNullable: true})

        // radioactivity: createRadioactiveResourceForm(r?.schema?.radioactivity || r?.radioactivity || undefined),
        // storage: createResourceStorageForm(r?.schema?.storage && r?.storage || undefined),
        // disposal: createResourceDisposalForm(r?.schema?.disposal && r?.disposal || undefined),
        // consumables: new FormArray((r?.consumables || []).map(c => createEquipmentConsumableForm(c)))
    });
}
