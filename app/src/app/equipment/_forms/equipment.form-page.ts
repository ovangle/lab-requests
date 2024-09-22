import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatRadioModule } from "@angular/material/radio";
import { Lab } from "src/app/lab/lab";
import { LabSearchComponent } from "../../lab/lab-search.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { TextFieldModule } from "@angular/cdk/text-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { EquipmentInstallationFormComponent, EquipmentInstallationFormGroup, equipmentInstallationFormGroupFactory } from "../installation/equipment-installation-form.component";
import { EquipmentFormComponent, EquipmentFormGroup } from "../equipment-form.component";
import { ActivatedRoute, Router } from "@angular/router";
import { Equipment, EquipmentCreateRequest, EquipmentService } from "../equipment";
import { ScaffoldFormPaneControl } from "src/app/scaffold/form-pane/form-pane-control";
import { EquipmentNameUniqueValidator } from "../equipment-name-unique-validator";
import { EquipmentTrainingDescriptionsFieldHint, EquipmentTrainingDescriptionsInputComponent } from "../training/training-descriptions-input.component";
import { UniDisciplineSelect } from "src/app/uni/discipline/discipline-select.component";
import { UniCampusSelect } from "src/app/uni/campus/campus-select.component";
import { Discipline } from "src/app/uni/discipline/discipline";
import { map, of, shareReplay, switchMap } from "rxjs";
import { EquipmentContext } from "../equipment-context";

/**
 * Create an entirely new piece of equipment, and declare any
 * labs that it is known to exist in.
 */
@Component({
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,

        EquipmentFormComponent
    ],
    template: `
    <h3>Create equipment</h3>

    @let equipment = this.equipment$ | async;

    <equipment-form [equipment]="equipment"
                    (submit)="_onEquipmentFormSubmit($event)"
                    (cancel)="_closeFormPane()" />
    `,
    styles: `
    .installations-header {
        display: flex;
        justify-content: space-between;
    }

    .form-controls {
        float: right;
    }
    `,
    providers: [
        EquipmentContext
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EquipmentFormPage {
    readonly router = inject(Router);
    route = inject(ActivatedRoute);
    readonly _formPane = inject(ScaffoldFormPaneControl);
    readonly _equipmentService = inject(EquipmentService);

    readonly equipment$ = this.route.paramMap.pipe(
        map(params => params.get('equipment')),
        switchMap(equipmentId => {
            if (equipmentId) {
                return this._equipmentService.fetch(equipmentId);
            }
            return of(null);
        }),
        shareReplay(1)
    );

    _onEquipmentFormSubmit(value: EquipmentFormGroup['value']) {
        const request: EquipmentCreateRequest = {
            name: value!.name!,
            description: value!.description,
            trainingDescriptions: value!.trainingDescriptions,
            installations: value.installations!.map(
                installation => ({
                    modelName: installation.modelName!,
                    lab: installation.lab!.id,
                    numInstalled: installation.numInstalled!,
                })
            )
        };

        this._equipmentService.create(request).subscribe((equipment) => {
            this.router.navigate(['/', {
                outlets: {
                    default: ['equipment', equipment.id],
                    form: null
                }
            }]);
        });
    }

    _closeFormPane() {
        this._formPane.close();
    }
}