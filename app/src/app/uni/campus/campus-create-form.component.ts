import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { CommonModule, NgIf } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Campus, CampusForm, CampusFormValidationErrors, CampusModelService} from "./campus";
import { Observable, filter, firstValueFrom, map } from "rxjs";
import { Form, FormGroup, ReactiveFormsModule, ValidationErrors } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ErrorStateMatcher } from "@angular/material/core";



@Component({
    selector: 'app-uni-campus-create-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule
    ],
    template: `
    <form [formGroup]="formGroup">
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
        CampusModelService
    ]
})
export class CampusCreateFormComponent {
    readonly campusService = inject(CampusModelService);
    readonly formGroup: CampusForm = this.campusService.campusForm({});

    readonly errors$: Observable<CampusFormValidationErrors | null> = this.formGroup.statusChanges.pipe(
        filter(status => ['INVALID'].includes(status) ),
        map(() => this.formGroup.errors as CampusFormValidationErrors || null)
    );
    
    readonly codeErrors$ = this.errors$.pipe(
        map((errors => errors?.code))
    );

    readonly nameErrors$ = this.errors$.pipe(
        map(errors => errors?.name)
    );

    @Input()
    get name(): string {
        return this.formGroup.value['name']!;
    }
    set name(value: string) {
        this.formGroup.patchValue({name: value});
    }

    @Output()
    committed = new EventEmitter<Campus>();

    @Output()
    cancelled = new EventEmitter<void>();

    async commit() {
        const campus = await firstValueFrom(this.campusService.commitForm(this.formGroup));
        this.committed.next(campus);
    }
    
    async cancel() {
        this.cancelled.next();
    }
    
}