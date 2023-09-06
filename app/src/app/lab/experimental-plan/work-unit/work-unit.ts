import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { Campus, isCampus } from "../../../uni/campus/campus";
import { Discipline, isDiscipline } from "../../../uni/discipline/discipline";
import { EquipmentLeaseForm, equipmentLeaseForm } from "../resources/equipment/equipment-lease";
import { InputMaterialForm, createInputMaterialForm } from "../resources/material/input/input-material";
import { OutputMaterialForm, createOutputMaterialForm } from "../resources/material/output/output-material";
import { ResourceContainer } from "../resources/resources";
import { SoftwareForm, createSoftwareForm } from "../resources/software/software";
import { LabType } from "../../type/lab-type";
import { Service, ServiceForm } from "../resources/service/service";
import { ResourceContainerPatch } from "../resources/resources";
import { ModelService } from "src/app/utils/models/model-service";
import { injectExperimentalPlanFromContext } from "../experimental-plan";

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

export interface WorkUnitPatch extends ResourceContainerPatch {


}

export type WorkUnitForm = FormGroup<{
    campus: FormControl<Campus | null>;
    labType: FormControl<Discipline | null>;
    technician: FormControl<string>;
    summary: FormControl<string>;

    startDate: FormControl<Date | null>;
    endDate: FormControl<Date | null>;

    equipments: FormArray<EquipmentLeaseForm>;
    softwares: FormArray<SoftwareForm>;
    services: FormArray<ServiceForm>;

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
            (params.equipments || []).map((e) => equipmentLeaseForm(e))
        ),
        softwares: new FormArray(
            (params.softwares || []).map((e) => createSoftwareForm(e))
        ),
        services: new FormArray(
            (params.services || []).map((e) => createServiceForm(e))
        ),
        inputMaterials: new FormArray(
            (params.inputMaterials || []).map(e => createInputMaterialForm(e))
        ),
        outputMaterials: new FormArray(
            (params.outputMaterials || []).map(e => createOutputMaterialForm(e))
        )
    });
}
function createServiceForm(e: Service): any {
    throw new Error("Function not implemented.");
}

export class WorkUnitModelService extends ModelService<WorkUnit, WorkUnitPatch> {
    override resourcePath = '/lab/experimental-plans/work-units';
    override modelFromJson(json: object): WorkUnit {
        return new WorkUnit(json);
    }
    override patchToJson(patch: WorkUnitPatch): object {
        return patch;
    }

    experimentalPlan$ = injectExperimentalPlanFromContext();

    readonly resourcePath = this.experimentalPlan$.pipe(
        map(plan => {
            if (plan == null) {
                throw new Error('WorkUnit model service requires an experimental plan context');
            }
        })
    )

}