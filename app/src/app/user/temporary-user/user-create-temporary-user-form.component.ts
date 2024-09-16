import { CommonModule } from "@angular/common";
import { Component, DestroyRef, EventEmitter, Input, Output, inject } from "@angular/core";
import { AbstractControl, EmailValidator, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { CampusLookup } from "src/app/uni/campus/campus";
import { Discipline } from "src/app/uni/discipline/discipline";
import { CreateTemporaryUserRequest } from "../user";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { filter } from "rxjs";
import { UniCampusSelect } from "src/app/uni/campus/campus-select.component";
import { UniDisciplineSelect } from "src/app/uni/discipline/discipline-select.component";
import { MatButtonModule } from "@angular/material/button";

function cquEmailValidator(control: AbstractControl<string>) {
    const value = control.value;
    if (!value.endsWith('@cqu.edu.au')) {
        return { cquEmail: 'Email must be a cqu.edu.au address' };
    }
    return null;
}

export type CreateTemporaryUserForm = FormGroup<{
    name: FormControl<string>;
    email: FormControl<string>;
    campus: FormControl<string | CampusLookup | null>;
    discipline: FormControl<Discipline | null>;
}>;

function createTemporaryUserRequestFromForm(form: CreateTemporaryUserForm): CreateTemporaryUserRequest {
    if (!form.valid) {
        throw new Error('Invalid form has no value');
    }
    return {
        name: form.value.name!,
        email: form.value.email!,
        baseCampus: form.value.campus!,
        discipline: form.value.discipline!
    }
}

@Component({
    selector: 'user-create-temporary-user-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,

        UniCampusSelect,
        UniDisciplineSelect
    ],
    template: `
    <form [formGroup]="form" (ngSubmit)="_onFormSubmit($event)">
        <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" required/>

            @if (nameErrors && nameErrors['required']) {
                <mat-error>A value is required</mat-error>
            }
        </mat-form-field>

        <mat-form-field>
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" required>

            @if (emailErrors && emailErrors['required']) {
                <mat-error>A value is required</mat-error>
            }

            @if (emailErrors && (emailErrors['email'] || emailErrors['cquEmail'])) {
                <mat-error>Expected a <i>*&#64;cqu.edu.au</i> email address</mat-error>
            }
        </mat-form-field>

        <mat-form-field>
            <mat-label>User base campus</mat-label>
            <uni-campus-select formControlName="campus" />
            @if (campusErrors && campusErrors['required']) {
                <mat-error>A value is required</mat-error>
            }
        </mat-form-field>

        <mat-form-field>
            <mat-label>User primary discipline</mat-label>
            <uni-discipline-select formControlName="discipline" />

            @if (disciplineErrors && disciplineErrors['required']) {
                <mat-error>A value is required</mat-error>
            }
        </mat-form-field>

        <button mat-raised-button type="submit"
                [disabled]="!form.valid">
            Save
        </button>

    </form>
    `
})
export class CreateTemporaryUserFormComponent {
    _destroyRef = inject(DestroyRef);

    @Input()
    get saveOnValid(): boolean {
        return this._saveOnValid;
    }
    set saveOnValid(input: BooleanInput) {
        this._saveOnValid = coerceBooleanProperty(input);
    }
    _saveOnValid: boolean = false;

    @Output()
    save = new EventEmitter<CreateTemporaryUserRequest>();

    readonly form: CreateTemporaryUserForm = new FormGroup({
        name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        email: new FormControl('', {
            nonNullable: true,
            validators: [
                Validators.required,
                Validators.email,
                cquEmailValidator
            ]
        }),
        campus: new FormControl<CampusLookup | string | null>(null, {
            validators: [Validators.required]
        }),
        discipline: new FormControl<Discipline | null>(null, {
            validators: [Validators.required]
        })
    })

    ngOnInit() {
        const autoSaveSubscription = this.form.valueChanges.pipe(
            filter(() => this.saveOnValid && this.form.valid)
        ).subscribe(() => {
            const request = createTemporaryUserRequestFromForm(this.form);
            this.save.emit(request);
        });
        this._destroyRef.onDestroy(() => {
            autoSaveSubscription.unsubscribe();
        })
    }

    get nameErrors() {
        return this.form.controls.name.errors;
    }

    get emailErrors() {
        return this.form.controls.email.errors;
    }

    get campusErrors() {
        return this.form.controls.campus.errors;
    }

    get disciplineErrors() {
        return this.form.controls.discipline.errors;
    }

    _onFormSubmit(evt: Event) {
        evt.preventDefault();
        const request = createTemporaryUserRequestFromForm(this.form);
        this.save.next(request);
    }

}