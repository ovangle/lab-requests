import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ChangeDetectorRef, Component, ViewChild, inject } from "@angular/core";
import { Campus } from "src/app/uni/campus/campus";
import { InputMaterial } from "../../resources/material/input/input-material";
import { Software } from "../../resources/software/software";
import { WorkUnit, WorkUnitContext, WorkUnitCreate } from "../../work-unit";
import { Subscription, defer, firstValueFrom, of } from "rxjs";
import { WorkUnitFormComponent } from "../../work-unit-form.component";
import { WorkUnitForm, workUnitForm, workUnitPatchFromForm } from "../../work-unit-form";
import { CommonModule } from "@angular/common";
import { hazardClassFromDivision } from "../../resource/hazardous/hazardous";

const workUnitCreateFixture: Partial<WorkUnitCreate> = {
    planId: 'e7a33211-1227-4d1d-994d-85a480c15ac0',
    campus: 'ROK',
    labType: 'ICT',
    technician: 'hello@world.com',
    /*
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
    */
};

@Component({
    selector: 'lab-work-unit-create-page',
    template: `
        <lab-work-unit-form [committed]="null" [form]="form">
        </lab-work-unit-form>

        <div class="form-actions">
            <button mat-raised-button (click)="save(); $event.stopPropagation()">
                <mat-icon>save</mat-icon>save
            </button>
        </div>
    `,
    styles: [`
    .form-actions button {
        float: right;
    }
    `],
})
export class WorkUnitCreatePage {
    _context = inject(WorkUnitContext);
    _cdRef = inject(ChangeDetectorRef);

    readonly form = workUnitForm();
    readonly patch$ = defer(() => workUnitPatchFromForm(this.form));

    constructor() {
        this._context.initCreateContext();
    }

    ngAfterViewInit() {
        this.form.patchValue({
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

    async save() {
        if (!this.form.valid) {
            throw new Error('Cannot save invallid form');
        }
        const patch = await firstValueFrom(this.patch$);
        this._context.create(patch);
    }
}