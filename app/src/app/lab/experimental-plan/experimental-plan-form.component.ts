import { Component, inject } from "@angular/core";
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { Software } from "../resources/software/software";
import { isAfter } from "date-fns";
import { ExperimentalPlan, ExperimentalPlanForm, ExperimentalPlanService, experimentalPlanForm } from "./experimental-plan";
import { InputMaterial } from "../resources/material/input/input-material";
import { hazardClassByDivision } from "../resources/common/hazardous/hazardous";
import { ActivatedRoute } from "@angular/router";
import { WorkUnit, WorkUnitForm } from "./work-unit/work-unit";
import { Campus } from "src/app/uni/campus/campus";
import { WorkUnitFormService, WorkUnitResourceContainerFormService } from "./work-unit/work-unit-form.component";
import { ResourceContainerFormService } from "../resources/resources";

const experimentalPlanFixture = new ExperimentalPlan({
    campus: new Campus({code: 'ROK'}),
    workUnits: [
        new WorkUnit({
            campus: new Campus({code: 'ROK'}),
            labType: 'ICT',
            technician: 'hello@world.com',
            softwares: [
                new Software({ name: 'MATLAB', description: 'test', minVersion: '3.21' }),
                new Software({ name: 'Microsoft Word', description: 'Microsoft stuff', minVersion: '6304' })
            ],
            inputMaterials: [
                new InputMaterial({
                    name: 'poison',
                    baseUnit: 'L',
                    hazardClasses: [
                        hazardClassByDivision('1.4'),
                        hazardClassByDivision('6')
                    ]
                })
            ]
        })
    ],
    submittedBy: 'hello@world.com'
});

@Component({
    selector: 'lab-request-form',
    templateUrl: './experimental-plan-form.component.html',
    styleUrls: [
        './experimental-plan-form.component.css'
    ],
    providers: [
        ExperimentalPlanService,
        WorkUnitFormService,
        {
            provide: ResourceContainerFormService,
            useClass: WorkUnitResourceContainerFormService
        }
    ]
})
export class ExperimentalPlanFormComponent {
    readonly planService = inject(ExperimentalPlanService);

    readonly currentUser: string = 't.stephenson@cqu.edu.au';

    get form(): ExperimentalPlanForm {
        return this.planService.form!;
    }

    ngOnInit() {
        this.planService.init(experimentalPlanFixture);
    }

    get workUnitForms(): WorkUnitForm[] {
        return this.form.controls['workUnits'].controls;
    }

    /**
     * If there is a work unit form with no associated work unit,
     * then we are currently adding one.
     */
    isAddingWorkUnit(plan: ExperimentalPlan): boolean {
        return plan.workUnits.length < this.workUnitForms.length;
    }
}
