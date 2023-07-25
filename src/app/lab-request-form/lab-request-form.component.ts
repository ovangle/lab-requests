import { Component } from "@angular/core";
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { EquipmentResource, EquipmentResourceFormGroup, createEquipmentResourceForm } from "../equipment-resource-form/equipment-resource-form.component";
import { SoftwareResource, SoftwareResourceForm, createSoftwareResourceForm } from "../software-resource-form/software-resource-form.component";
import { ConsumableResource, ConsumableResourceForm, createConsumableResourceForm } from "../consumable-resource-form/consumable-resource-form.component";
import { ProjectLocation, ProjectLocationForm, createProjectLocationForm } from "../project-location-form/project-location-form.component";
import { isAfter } from "date-fns";

interface Project {
    title: string;
    projectSummary: string;
    experimentalPlanSummary: string;

    projectFrom: Date | null;
    projectTo: Date | null;

    /**
     * Researchers other than the ones who submitted the form.
     */
    additionalResearchers: string | string[];
    supervisors: string | string[];

    locations: ProjectLocation[];

    softwares: SoftwareResource[];
    equipments: EquipmentResource[];
    consumables: ConsumableResource[];

    submittedBy: string;
    submittedAt: Date;
}

export function projectAdditionalResearchersToArray(project: Project): string[] {
    const researchers = project.additionalResearchers;
    if (typeof researchers === 'string') {
        return researchers
            .split(/\s+/)
            .map(s => s.trim().toLocaleLowerCase())
            .filter(s => s != '');
    }
    return researchers;
}

export function projectSupervisorsToArray(project: Project): string[] {
    const supervisors = project.supervisors;
    if (typeof supervisors === 'string') {
        return supervisors.split(/\s+/)
            .map(s => s.trim().toLocaleLowerCase())
            .filter(s => s != '');
    }
    return supervisors;
}

function projectFromValidator(control: AbstractControl<any, any>) {
    if (control.value != null && !isAfter(control.value, new Date())) {
        return { 'afterToday': 'Must be a future date'};
    }
    return null;
}

function projectToValidator(control: AbstractControl<any, any>) {
    const projectFrom = (control.parent as FormGroup | null)?.controls['projectFrom']?.value;
    if (projectFrom != null && control.value != null && !isAfter(control.value, projectFrom)) {
        return {'beforeProjectFrom': 'Cannot end before project starts'};
    }
    return null;
}

type ProjectForm = FormGroup<{
    [K in keyof Project]: Project[K] extends Array<any> ? FormArray<any> : FormControl<Project[K]>
}>

function createProjectForm(currentUser: string): ProjectForm {
    return new FormGroup({
        title: new FormControl('', {nonNullable: true}),
        projectSummary: new FormControl('', {nonNullable: true}),
        experimentalPlanSummary: new FormControl('', {nonNullable: true}),

        projectFrom: new FormControl<Date | null>(null, {
            validators: [
                Validators.required,
                projectFromValidator
            ]
        }),
        projectTo: new FormControl<Date | null>(null, {
            validators: [
                Validators.required,
                projectToValidator
            ]
        }),

        additionalResearchers: new FormControl<string | string[]>('', {nonNullable: true}),
        supervisors: new FormControl<string | string[]>('', {nonNullable: true}),

        locations: new FormArray<ProjectLocationForm>([
            createProjectLocationForm(true)
        ]),

        equipments: new FormArray<EquipmentResourceFormGroup>([]),
        softwares: new FormArray<SoftwareResourceForm>([]),
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

    ngOnInit() {
        this.form.valueChanges.subscribe(v => {
            console.log(v);
        })
    }

    addSecondaryProjectLocation() {
        const projectLocation = createProjectLocationForm(false);
        this.form.controls['locations'].push(projectLocation);
    }

    addRequiredSoftware() {
        const softwareForm = createSoftwareResourceForm();
        this.form.controls['softwares'].push(softwareForm);
    }

    addRequiredEquipment() {
        const equipmentForm = createEquipmentResourceForm();
        this.form.controls['equipments'].push(equipmentForm);
    }

    addRequiredConsumable() {
        const consumableForm = createConsumableResourceForm();
        this.form.controls['consumables'].push(consumableForm);
    }

}
