import { Component, EventEmitter, Injectable, Input, Output, inject } from "@angular/core";
import { CommonModule, NgIf } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Campus, CampusPatchErrors, CampusModelService, CampusContext, CampusCode, CampusPatch} from "./campus";
import { Observable, filter, firstValueFrom, map, switchMap } from "rxjs";
import { AbstractControl, Form, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ErrorStateMatcher } from "@angular/material/core";

export type CampusForm = FormGroup<{
    code: FormControl<CampusCode>;
    name: FormControl<string>;
}>;

function campusPatchFromForm(form: CampusForm): CampusPatch {
    if (!form.valid) {
        throw new Error('Cannot get patch from invalid form');
    }
    return form.value as CampusPatch;
}

function campusPatchErrorsFromForm(form: CampusForm): CampusPatchErrors | null {
    if (!form.invalid) {
        return null;
    }
    return form.errors as CampusPatchErrors;
}

@Injectable()
export class CampusFormService {
    readonly model = inject(CampusModelService);
    readonly context = inject(CampusContext);
    readonly committed$ = this.context.committed$;

    readonly form = new FormGroup({
        code: new FormControl<CampusCode>(
            '',
            {
                nonNullable: true,
                validators: [
                    Validators.required, 
                    Validators.pattern(/^[_A-Z]{0,8}$/),
                ],
                asyncValidators: [
                    (control) => this._validateCodeUnique(control)
                ]
            }
        ),
        name: new FormControl<string>(
            '',
            {nonNullable: true, validators: [Validators.required]}
        )
    });

    readonly patch$ = this.form.statusChanges.pipe(
        filter(status => status === 'VALID'),
        map(() => campusPatchFromForm(this.form))
    );

    readonly formErrors$ = this.form.statusChanges.pipe(
        map(() => campusPatchErrorsFromForm(this.form))
    );

    _validateCodeUnique(control: AbstractControl<CampusCode>) {
        return control.valueChanges.pipe(
            switchMap(value => this.model.getCampusesByCode(value)), 
            map(campuses => {
                if (campuses.length > 0) {
                    return { notUnique: 'Code is not unique amongst campuses'}
                }
                return null;
            })
        )
    }

    commit(): Promise<Campus> {
        if (!this.form.valid) {
            throw new Error('Cannot submit invalid form');
        }
        const patch = campusPatchFromForm(this.form)!;
        return this.context.commit(patch);
    }

    async reset(): Promise<void> {
        this.form.reset();
        const committed = await firstValueFrom(this.committed$);
        this.form.patchValue(committed);
    }
}


@Component({
    selector: 'app-uni-campus-patch-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule
    ],
    template: `
    <form [formGroup]="form">
        <mat-form-field>
            <mat-label>Code</mat-label>
            <input matInput formControlName="code"> 

            <ng-container *ngIf="codeErrors$ | async as codeErrors">
                <mat-error *ngIf="codeErrors.required"> 
                    A value is required
                </mat-error>
                <mat-error *ngIf="codeErrors.pattern as pattern">
                    {{pattern}} must match pattern
                </mat-error>
                <mat-error *ngIf="codeErrors.notUnique">
                    Value is not unique
                </mat-error>
            </ng-container>
        </mat-form-field>
    
        <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput type="text" formControlName="name"/>

            <ng-container *ngIf="nameErrors$ | async as nameErrors">
                <mat-error *ngIf="nameErrors.required">
                    A name is required
                </mat-error>
            </ng-container>
        </mat-form-field>

        <div class="form-actions">
            <button mat-button (click)="commit()">Save</button>
            <button mat-butgton (click)="cancel()">Cancel</button>
        </div>
    </form>
    `,
    providers: [
        CampusFormService
    ]
})
export class CampusFormComponent {
    readonly formService = inject(CampusFormService);
    readonly formErrors$ = this.formService.formErrors$

    readonly form = this.formService.form;
    
    readonly codeErrors$ = this.formErrors$.pipe(
        map(errors => errors?.code)
    );

    readonly nameErrors$ = this.formErrors$.pipe(
        map(errors => errors?.name)
    );

    @Input()
    get name(): string {
        return this.formService.form.value['name']!;
    }
    set name(value: string) {
        this.formService.form.patchValue({name: value});
    }

    async commit() {
        const campus = await this.formService.commit();
        console.log(`committed ${campus.id}`);
    }
    
    async cancel() {
        this.formService.form.reset();
    }
    
}