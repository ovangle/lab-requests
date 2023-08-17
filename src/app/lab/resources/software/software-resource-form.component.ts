import { NumberInput, coerceNumberProperty } from "@angular/cdk/coercion";
import { CommonModule } from "@angular/common";
import { Component, HostBinding, Injectable, Input, OnInit, inject } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { Software, SoftwareForm, createSoftwareForm } from "./software";
import { ResourceTableDataSource } from "../common/resource-table.component";
import { ActivatedRoute, Router } from "@angular/router";
import { RESOURCE_TYPE, ResourceFormComponent } from "../common/resource-form.component";


@Component({
    selector: 'lab-req-software-resource-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,

        ResourceFormComponent,
    ],
    template: `
    <lab-req-resource-form #resourceForm>
        <form *ngIf="resourceForm.form" [formGroup]="resourceForm.form">
            <mat-form-field>
                    <mat-label>Name</mat-label>
                    <input matInput
                        id="software-name"
                        formControlName="name"
                        />
            </mat-form-field>

            <mat-form-field>
                    <mat-label>Description</mat-label>
                    <textarea matInput type="text"
                        id="software-description"
                        formControlName="description">
                    </textarea>
            </mat-form-field>

            <mat-form-field>
                    <mat-label>Minimum version</mat-label>
                    <input matInput type="text"
                        id="software-min-version"
                        formControlName="minVersion" />
            </mat-form-field>
        </form>
    </lab-req-resource-form>
    `,
    styles: [`


        form {
            display: flex;
            flex-direction: column;
        }
    `],
    providers: [
        { provide: RESOURCE_TYPE, useValue: 'software' }
    ]
})
export class SoftwareResourceFormComponent {}
