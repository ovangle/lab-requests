import { Injectable } from "@angular/core";
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { Observable, of, throwError } from "rxjs";
import { Campus } from "src/app/lab/experimental-plan/campus/campus";

/**
 * An equipment represents a fixture in a lab, thus is statically
 * knowable from the inventory of the lab.
 */
export class EquipmentSchema {
    readonly name: string;
    readonly isProvisioned: boolean;

    availableInLabTypes: string[];

    isUniversitySupplied: boolean;

    /** This equipment requires specialist training before use */
    requiresTraining: boolean;
    trainingDescription: string;

    constructor(params: { name: string } & Partial<EquipmentSchema>) {
        this.name = params.name;
        this.availableInLabTypes = params.availableInLabTypes || [];

        this.isUniversitySupplied = !!params.isUniversitySupplied;

        this.requiresTraining = !!params?.requiresTraining;
        this.trainingDescription = params?.trainingDescription || '';
    }
}

export type EquipmentSchemaForm = FormGroup<{
    name: FormControl<string>;
    isProvisioned: FormControl<boolean>;
    availableInLabTypes: FormArray<FormControl<string>>;

    isUniversitySupplied: FormControl<boolean>;
    estimatedCost: FormControl<number>;

    /** This equipment requires specialist training */
    requiresTraining: FormControl<boolean>;
    trainingDescription: FormControl<string>;
}>;

export function isEquipmentSchemaForm(obj: any): obj is EquipmentSchemaForm {
    return obj instanceof FormGroup;
}

function validateTrainingDescription(control: AbstractControl<string>) {
    if (control.parent?.value?.requiresTraining) {
        return Validators.required(control);
    }
    return null;
}

export function createEquipmentSchemaForm(equipment: Partial<EquipmentSchema>): EquipmentSchemaForm {
    return new FormGroup({
        name: new FormControl<string>('', {nonNullable: true, validators: [Validators.required]}),
        isProvisioned: new FormControl<boolean>(false, {nonNullable: true}),
        availableInLabTypes: new FormArray<FormControl<string>>([]),

        isUniversitySupplied: new FormControl<boolean>(false, {nonNullable: true}),
        estimatedCost: new FormControl<number>(0, {nonNullable: true}),

        requiresTraining: new FormControl<boolean>(false, {nonNullable: true}),
        trainingDescription: new FormControl<string>('', {nonNullable: true, validators: validateTrainingDescription})
    });
}

@Injectable()
export class EquipmentSchemaService {
    readonly equipmentSchemas = [
        new EquipmentSchema({ name: '3d printer', isProvisioned: true}),
        new EquipmentSchema({ name: '3d metal printer', isProvisioned: true, requiresTraining: true, trainingDescription: 'Listens to heavy metal'}),
        new EquipmentSchema({ name: 'Hammer', isProvisioned: true }),
    ]

    readonly matchStrings: Array<[EquipmentSchema, string]> = this.equipmentSchemas.map(
        schema => {
            return [schema, [schema.name, ...schema.availableInLabTypes]
                .map(s => s.toLocaleLowerCase())
                .join(' ')]
        }
    )

    fetchSchema(name: string): Observable<EquipmentSchema> {
        const schema = this.equipmentSchemas.filter(s => s.name === name)[0];
        if (schema == null) {
            return throwError(() => new Error('Requires training'));
        }
        return of(schema);
    }

    matchSchemas(searchParam: string | null): Observable<EquipmentSchema[]> {
        const lowerParams = (searchParam || '').split(/\s+/)
            .filter(p => !!p)
            .map(p => p.toLocaleLowerCase());

        const matchedSchemas = this.matchStrings
            .filter(([_, matchString]) => lowerParams.length === 0 || lowerParams.every(param => matchString.includes(param)))
            .map(([schema, _]) => schema);

        return of(matchedSchemas);
    }

    availableUnitsAtCampus(schema: EquipmentSchema, campus: Campus): Observable<number> {
        /** TODO: Implement this */
        if (!schema.isProvisioned) {
            return of(0);
        }
        return of(1);
    }
}