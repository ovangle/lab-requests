import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ChangeDetectorRef, Component, ViewChild, inject } from "@angular/core";
import { InputMaterial } from "../../resources/material/input/input-material";
import { SoftwareParams } from "../../resources/software/software";
import { Subscription, defer, firstValueFrom, of } from "rxjs";
import { WorkUnitFormComponent } from "../../work-unit-form.component";
import { WorkUnitForm, workUnitForm, workUnitPatchFromForm } from "../../common/work-unit-form";
import { CommonModule } from "@angular/common";
import { hazardClassFromDivision } from "../../resource/hazardous/hazardous";
import { WorkUnitContext, WorkUnitPatch, WorkUnitService } from "../../common/work-unit";

const workUnitCreateFixture: Partial<WorkUnitPatch & {planId: string}> = {
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
    _cdRef = inject(ChangeDetectorRef);
    readonly service = inject(WorkUnitService);

    readonly form = workUnitForm();
    readonly patch$ = defer(() => workUnitPatchFromForm(this.form));

    ngAfterViewInit() {
        this.form.patchValue({
            ...workUnitCreateFixture,
            addEquipments: [], 
            replaceEquipments: {},
            addTasks: [],
            replaceTasks: {},
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
        return firstValueFrom(this.service.create(patch));
    }
}