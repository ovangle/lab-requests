import { ChangeDetectorRef, Component, ViewChild, inject } from "@angular/core";
import { Campus } from "src/app/uni/campus/campus";
import { InputMaterial } from "../../resources/material/input/input-material";
import { Software } from "../../resources/software/software";
import { WorkUnit, WorkUnitContext, WorkUnitCreate } from "../../work-unit";
import { Subscription, of } from "rxjs";
import { WorkUnitFormComponent } from "../../work-unit-form.component";
import { WorkUnitForm, WorkUnitFormService } from "../../work-unit-form.service";
import { CommonModule } from "@angular/common";
import { hazardClassFromDivision } from "../../resource/hazardous/hazardous";

const workUnitCreateFixture: Partial<WorkUnitCreate> = {
    planId: 'e7a33211-1227-4d1d-994d-85a480c15ac0',
    campus: 'ROK',
    labType: 'ICT',
    technician: 'hello@world.com',
    addSoftwares: [
        new Software({ name: 'MATLAB', description: 'test', minVersion: '3.21' }),
        new Software({ name: 'Microsoft Word', description: 'Microsoft stuff', minVersion: '6304' })
    ],
    addInputMaterials: [
        new InputMaterial({
            name: 'poison',
            baseUnit: 'L',
            hazardClasses: [
                hazardClassFromDivision('1.4'),
                hazardClassFromDivision('6')
            ]
        })
    ]
};

@Component({
    selector: 'lab-work-unit-create-page',
    template: `
        <lab-work-unit-form
            [committed]="_formService.committed$ | async"
            [form]="_formService.form"
            (requestCommit)="_formService.save()">
        </lab-work-unit-form>

        <div class="form-actions">
            <button mat-raised-button (click)="_formService.save(); $event.stopPropagation()">
                <mat-icon>save</mat-icon>save
            </button>
        </div>
    `,
    styles: [`
    .form-actions button {
        float: left;
    }
    `],
    providers: [
        WorkUnitFormService
    ]
})
export class WorkUnitCreatePage {
    _context = inject(WorkUnitContext);
    _cdRef = inject(ChangeDetectorRef);

    _formService = inject(WorkUnitFormService);

    @ViewChild(WorkUnitFormComponent, {static: true})
    workUnitForm: WorkUnitFormComponent;

    constructor() {
        this._context.sendCommitted(of(null));
        this._context.workUnit$.subscribe(
            workUnit => console.log(`context workUnit: ${workUnit}`)
        )
    }

    ngAfterViewInit() {
        this.workUnitForm.form.patchValue({
            ...workUnitCreateFixture,
            addEquipments: [],
            replaceEquipments: {},
            addServices: [],
            replaceServices: {},
            addSoftwares: [],
            replaceSoftwares: {},
            addInputMaterials: [],
            replaceInputMaterials: {},
            addOutputMaterials: [],
            replaceOutputMaterials: {}
        });
        this._cdRef.detectChanges();
    }
}