import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Campus, CampusService, campusForm } from "./campus";
import { firstValueFrom } from "rxjs";
import { ReactiveFormsModule } from "@angular/forms";


@Component({
    selector: 'app-uni-campus-create-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule
    ],
    template: `
    <ng-container [formGroup]="formGroup">
        <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput type="text" formControlName="name"/>
        </mat-form-field>
    </ng-container>

    `
})
export class CampusCreateFormComponent {
    readonly campusService = inject(CampusService);
    readonly formGroup = campusForm({});

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
}