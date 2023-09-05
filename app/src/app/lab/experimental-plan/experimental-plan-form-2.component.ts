import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { ExperimentalPlan, ExperimentalPlanModelService } from "./experimental-plan";
import { BehaviorSubject } from "rxjs";
import { Campus } from "src/app/uni/campus/campus";
import { WorkUnit } from "./work-unit/work-unit";
import { Software } from "../resources/software/software";
import { InputMaterial } from "../resources/material/input/input-material";
import { hazardClassByDivision } from "../resources/common/hazardous/hazardous";

const EXPERIMENTAL_PLAN_FIXTURE = new ExperimentalPlan({
    campus: new Campus({code: 'ROK', name: 'Rockhampton'}),
    workUnits: [
        new WorkUnit({
            campus: new Campus({code: 'ROK', name: 'Rockhampton'}),
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
    selector: 'app-lab-create-experimental-plan-form',
    standalone: true,
    imports: [
        CommonModule
    ],
    template: `

    `
})
export class CreateExperimentalPlanFormComponent implements OnInit, OnDestroy{
    readonly modelService = inject(ExperimentalPlanModelService);
    readonly committedSubject = new BehaviorSubject<ExperimentalPlan | null>(null);

    readonly formGroup = experimentalPlanForm({});

    ngOnInit() {
        this.committedSubject.next(EXPERIMENTAL_PLAN_FIXTURE);
    }

    ngOnDestroy() {
        this.committedSubject.complete();
    }

    async commit(): Promise<ExperimentalPlan> {
        if (!this.formGroup.valid) {
            throw new Error('Cannot commit invalid form');
        }
        const currentId = this.committedSubject.value?.id;

        if (currentId) {
            const patch = patfh
        }
    }
}