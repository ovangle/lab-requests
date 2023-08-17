import { Component, inject } from "@angular/core";
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { Software } from "../resources/software/software";
import { isAfter } from "date-fns";
import { ExperimentalPlan, ExperimentalPlanForm, ExperimentalPlanService, createExperimentalPlanForm } from "./experimental-plan";
import { InputMaterial } from "../resources/material/input/input-material";
import { hazardClassByDivision } from "../resources/common/hazardous/hazardous";
import { ActivatedRoute } from "@angular/router";

const experimentalPlanFixture = new ExperimentalPlan({
    softwares: [
        new Software({name: 'MATLAB', description: 'test', minVersion: '3.21'}),
        new Software({name: 'Microsoft Word', description: 'Microsoft stuff', minVersion: '6304'})
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
});

@Component({
    selector: 'lab-request-form',
    templateUrl: './experimental-plan-form.component.html',
    styleUrls: [
        './experimental-plan-form.component.css'
    ],
    providers: [
        ExperimentalPlanService
    ]
})
export class ExperimentalPlanFormComponent {
    readonly planService = inject(ExperimentalPlanService);

    readonly currentUser: string = 't.stephenson@cqu.edu.au';
    readonly form: ExperimentalPlanForm = createExperimentalPlanForm({submittedBy: this.currentUser});

    ngOnInit() {
        this.planService.init(experimentalPlanFixture);
    }
}
