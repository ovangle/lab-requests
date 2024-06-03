import { Component, DestroyRef, Injectable, inject } from "@angular/core";
import { ModelIndex } from "src/app/common/model/model-index";
import { Software, SoftwareQuery, SoftwareService } from "../software";
import { ActivatedRoute, ParamMap } from "@angular/router";
import { AsyncPipe } from "@angular/common";
import { MatListModule } from "@angular/material/list";
import { UserContext } from "src/app/user/user-context";
import { combineLatest } from "rxjs";
import { SoftwareInfoComponent } from "../software-info.component";
import { SoftwareIndex } from "../software-index";



@Component({
    standalone: true,
    imports: [
        AsyncPipe,
        MatListModule,

        SoftwareInfoComponent
    ],
    template: `
    @if (index.pageItems$ | async; as pageItems) {
        <h1>Software</h1>
        
        <mat-list>
        @for (item of pageItems; track item.id) {
            <mat-list-item>
                <software-info [software]="item"
                               display="list-item" />
            </mat-list-item>
        }
        </mat-list>
    }
    `,
    providers: [
        SoftwareIndex
    ]
})
export class SoftwareIndexPage {
    readonly index = inject(SoftwareIndex);
}