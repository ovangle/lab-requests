import { Component } from "@angular/core";
import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { EquipmentResource, EquipmentResourceFormGroup } from "../equipment-resource-form/equipment-resource-form.component";
import { SoftwareResource, SoftwareResourceFormGroup } from "../software-resource-form/software-resource-form.component";
import { ConsumableResource, ConsumableResourceForm } from "../consumable-resource-form/consumable-resource-form.component";
import { ProjectLocation, ProjectLocationForm, createProjectLocationForm } from "../project-location-form/project-location-form.component";

interface Project {
    title: string;
    projectSummary: string;
    experimentalPlanSummary: string;

    projectFrom: Date | null;
    projectTo: Date | null;

    /**
     * Researchers other than the ones who submitted the form.
     */
    additionalResearchers: string[];

    locations: ProjectLocation[];

    softwares: SoftwareResource[];
    equipments: EquipmentResource[];
    consumables: ConsumableResource[];

    submittedBy: string;
    submittedAt: Date;
}

type ProjectForm = FormGroup<{
    [K in keyof Project]: Project[K] extends Array<any> ? FormArray<any> : FormControl<Project[K]>
}>

function createProjectForm(currentUser: string): ProjectForm {
    return new FormGroup({
        title: new FormControl('', {nonNullable: true}),
        projectSummary: new FormControl('', {nonNullable: true}),
        experimentalPlanSummary: new FormControl('', {nonNullable: true}),

        projectFrom: new FormControl<Date | null>(null),
        projectTo: new FormControl<Date | null>(null),

        additionalResearchers: new FormArray<FormControl<string>>([]),

        locations: new FormArray<ProjectLocationForm>([
            createProjectLocationForm(true)
        ]),

        equipments: new FormArray<EquipmentResourceFormGroup>([]),
        softwares: new FormArray<SoftwareResourceFormGroup>([]),
        consumables: new FormArray<ConsumableResourceForm>([]),

        // Hidden fields
        submittedBy: new FormControl(currentUser, { nonNullable: true}),
        submittedAt: new FormControl(new Date(), { nonNullable: true})
    })
}

@Component({
    selector: 'lab-request-form',
    templateUrl: './lab-request-form.component.html',
})
export class LabRequestFormComponent {
    readonly currentUser: string = 't.stephenson@cqu.edu.au';
    readonly form: ProjectForm = createProjectForm(this.currentUser);

    addSecondaryProjectLocation() {
        const projectLocation = createProjectLocationForm(false);
        this.form.controls['locations'].push(projectLocation);
    }
}