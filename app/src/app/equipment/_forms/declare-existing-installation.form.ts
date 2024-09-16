import { CommonModule } from "@angular/common";
import { Component, DestroyRef, effect, inject } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { combineLatest, map, Observable, of, switchMap } from "rxjs";
import { Equipment, EquipmentService } from "../equipment";
import { EquipmentSearchComponent } from "../equipment-search.component";
import { EquipmentInstallationFormComponent, equipmentInstallationFormGroupFactory } from "../installation/equipment-installation-form.component";
import { EquipmentInfoComponent } from "../equipment-info.component";
import { Lab, LabService } from "src/app/lab/lab";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { A } from "@angular/cdk/keycodes";
import { Discipline, isDiscipline } from "src/app/uni/discipline/discipline";

function equipmentHintFromRouteParams() {
    const route = inject(ActivatedRoute);
    const equipmentService = inject(EquipmentService);

    return route.queryParamMap.pipe(
        map(params => params.get('equipment')),
        switchMap(equipmentId => {
            if (equipmentId) {
                return equipmentService.fetch(equipmentId);
            }
            return of(undefined);
        })

    )
}

function labHintFromRouteParams() {
    const route = inject(ActivatedRoute);
    const labService = inject(LabService);

    return route.queryParamMap.pipe(
        map(params => params.get('lab')),
        switchMap(labId => {
            if (labId) {
                return labService.fetch(labId);
            }
            return of(undefined);
        })
    );
}

function labDisciplineHintFromRouteParams(): Observable<Discipline[] | null> {
    const route = inject(ActivatedRoute);

    return route.queryParamMap.pipe(
        map(params => {
            const d = params.get('discipline');
            if (d == null) {
                return null;
            }
            return d.split(',') as Discipline[];
        })
    );
}

@Component({
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,

        EquipmentInfoComponent,
        EquipmentSearchComponent,
        EquipmentInstallationFormComponent
    ],
    template: `
    <form [formGroup]="formGroup">
        @let disciplineHint = disciplineHint$ | async;

        @if (equipmentHint$ | async; as equipmentHint) {
            <equipment-info [equipment]="equipmentHint" />
        } @else {
            <mat-form-field>
                <mat-label>Equipment</mat-label>
                <equipment-search formGroupName="equipment"
                                  [discipline]="disciplineHint"/>
            </mat-form-field>
        }

        <equipment-installation-form [lab]="labHint$ | async"
                                     [labDiscipline]="disciplineHint" />
    </form>
    `
})
export class DeclareExistingInstallationForm {
    equipmentHint$ = equipmentHintFromRouteParams();
    labHint$ = labHintFromRouteParams();

    disciplineHint$ = combineLatest([
        labDisciplineHintFromRouteParams(),
        this.equipmentHint$
    ]).pipe(
        map(([paramHint, equipment]) => {
            if (paramHint) {
                return paramHint;
            }
            return equipment ? equipment.disciplines : null;
        })
    );

    equipmentService = inject(EquipmentService);

    fb = inject(FormBuilder);
    _equipmentInstallationForm = equipmentInstallationFormGroupFactory()

    formGroup = this.fb.group({
        equipment: this.fb.control<Equipment | null>(null),
        installation: this._equipmentInstallationForm()
    });

    constructor() {
        const syncFormEquipment = this.equipmentHint$.subscribe(equipment => {
            if (equipment) {
                this.formGroup.patchValue({equipment});
            }
        });

        inject(DestroyRef).onDestroy(() => {
            syncFormEquipment.unsubscribe();
        })
    }

}