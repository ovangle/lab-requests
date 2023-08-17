import { FormControl, FormGroup } from "@angular/forms";

export class Equipment implements Resource {
    readonly type: 'equipment';

    name: string;
    comments: string;
    estimatedCost: number | null;
    isUniversitySupplied: boolean;


    constructor(r?: Partial<Equipment>) {
        this.name = r?.name || '';
        this.comments = r?.comments || '';
        this.estimatedCost = r?.estimatedCost || null;
        this.isUniversitySupplied = r?.isUniversitySupplied || true;
    }
}


export type EquipmentResourceForm = FormGroup<{
    name: FormControl<string>,
    comments: FormControl<string>,
    estimatedCost: FormControl<number | null>,
    isUniversitySupplied: FormControl<boolean>,
}>

export function isEquipmentResourceForm(obj: any): obj is EquipmentResourceForm {
    return obj instanceof FormGroup;
}

export function createEquipmentResourceForm(r?: Partial<Equipment>): EquipmentResourceForm {
    return new FormGroup({
        name: new FormControl<string>(r?.name || '', {nonNullable: true}),
        comments: new FormControl<string>(r?.comments || '', {nonNullable: true}),
        estimatedCost: new FormControl<number | null>(r?.estimatedCost || null),
        isUniversitySupplied: new FormControl<boolean>(
            r?.isUniversitySupplied === undefined ? true : r.isUniversitySupplied,
            {nonNullable: true}
        ),
    });
}
