import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { Campus, isCampus } from "../../../uni/campus/campus";
import { Discipline, isDiscipline } from "../../../uni/discipline/discipline";
import { EquipmentForm, createEquipmentResourceForm } from "../../resources/equipment/equipment";
import { InputMaterialForm, createInputMaterialForm } from "../../resources/material/input/input-material";
import { OutputMaterialForm, createOutputMaterialForm } from "../../resources/material/output/output-material";
import { ResourceContainer } from "../../resources/resources";
import { SoftwareForm, createSoftwareForm } from "../../resources/software/software";
import { LabType } from "../../type/lab-type";

/**
 * A WorkUnit is a portion of an experimental plan which is conducted
 * at a specific campus at a lab under the control of a specific lab
 * technician.
 */

export class WorkUnit extends ResourceContainer {
    readonly campus: Campus;

    readonly labType: LabType;
    readonly technician: string;

    readonly summary: string;

    readonly startDate: Date | null;
    readonly endDate: Date | null;

    constructor(
        params: Partial<WorkUnit>
    ) {
        super(params);
        if (!isCampus(params['campus']))
            throw new Error('WorkUnit lab requires a campus');
        this.campus = params.campus;

        if (!isDiscipline(params.labType))
            throw new Error('WorkUnit lab requires a discipline');
        this.labType = params.labType;

        if (!params.technician)
            throw new Error('WorkUnit requires a technician')
        this.technician = params.technician;

        this.summary = params.summary || '';

        this.startDate = params.startDate || null;
        this.endDate = params.endDate || null;
   }
}

export type WorkUnitForm = FormGroup<{
    campus: FormControl<Campus | null>;
    labType: FormControl<Discipline | null>;
    technician: FormControl<string>;
    summary: FormControl<string>;

    startDate: FormControl<Date | null>;
    endDate: FormControl<Date | null>;

    equipments: FormArray<EquipmentForm>;
    softwares: FormArray<SoftwareForm>;

    inputMaterials: FormArray<InputMaterialForm>;
    outputMaterials: FormArray<OutputMaterialForm>;
}>;

export function workUnitForm(params: Partial<WorkUnit>): WorkUnitForm {
    return new FormGroup({
        campus: new FormControl(params.campus || null, {validators: [Validators.required]}),
        labType: new FormControl(params.labType || null, {validators: [Validators.required]}),
        technician: new FormControl(params.technician || '', {
            nonNullable: true,
            validators: [
                Validators.required,
                Validators.email
            ]
        }),
        summary: new FormControl(params.summary || '', {nonNullable: true}),

        startDate: new FormControl(params.startDate || null),
        endDate: new FormControl(params.endDate || null),

        equipments: new FormArray(
            (params.equipments || []).map((e) => createEquipmentResourceForm(e))
        ),
        softwares: new FormArray(
            (params.softwares || []).map((e) => createSoftwareForm(e))
        ),
        inputMaterials: new FormArray(
            (params.inputMaterials || []).map(e => createInputMaterialForm(e))
        ),
        outputMaterials: new FormArray(
            (params.outputMaterials || []).map(e => createOutputMaterialForm(e))
        )
    });
}
