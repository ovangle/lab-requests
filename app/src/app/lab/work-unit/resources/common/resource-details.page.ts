import { Component, Injectable, inject } from "@angular/core";
import { Resource, ResourceContext, ResourcePatch, ResourceType, isResourceType } from "./resource";
import { ActivatedRoute } from "@angular/router";
import { CommonModule } from "@angular/common";
import { Observable, Subscription, combineLatest, map } from "rxjs";
import { EquipmentLeaseFormComponent } from "../equipment/equipment-lease-form.component";
import { ServiceResourceFormComponent } from "../service/service-resource-form.component";
import { SoftwareResourceFormComponent } from "../software/software-resource-form.component";
import { OutputMaterialResourceFormComponent } from "../material/output/output-material-resource-form.component";
import { InputMaterialResourceFormComponent } from "../material/input/input-material-resource-form.component";

@Injectable()
export class ResourceDetailsPageResourceContext<T extends Resource, TPatch extends ResourcePatch> extends ResourceContext<T, TPatch> {
    readonly activatedRoute = inject(ActivatedRoute);

    override readonly resourceTypeFromContext$ = this.activatedRoute.url.pipe(
        map(segments => segments.filter(s => isResourceType(s.path))[0]),
        map(segment => {
            if (!segment) {
                throw new Error('No resource type in route');
            }
            return segment.path as ResourceType;
        })
    );

    override readonly indexFromContext$ = this.activatedRoute.paramMap.pipe(
        map(paramMap => {
            const index = Number.parseInt(paramMap.get('index')!);
            if (Number.isNaN(index)) {
                throw new Error('No index in params');
            }
            return index;
        })
    );
}

@Component({
    selector: 'app-lab-resource-details-page',
    standalone: true,
    imports: [
        CommonModule,
        EquipmentLeaseFormComponent,
        ServiceResourceFormComponent,
        SoftwareResourceFormComponent,

        InputMaterialResourceFormComponent,
        OutputMaterialResourceFormComponent
    ],
    template: `
    <ng-container [ngSwitch]="resourceType$ | async">
        <ng-container *ngSwitchCase="'equipment'">
            <lab-equipment-lease-form></lab-equipment-lease-form>
        </ng-container>
        <ng-container *ngSwitchCase="'software'">
            <lab-software-resource-form></lab-software-resource-form>
        </ng-container>
        <ng-container *ngSwitchCase="'service'">
            <lab-service-resource-form></lab-service-resource-form>
        </ng-container>
        <ng-container *ngSwitchCase="'input-material'">
            <lab-input-material-resource-form></lab-input-material-resource-form>
        </ng-container>
        <ng-container *ngSwichCase="'output-material'">
            <lab-output-material-resource-form></lab-output-material-resource-form>
        </ng-container>
    </ng-container>
    `,
    providers: [
        { provide: ResourceContext, useClass: ResourceDetailsPageResourceContext }
    ]
})
export class ResourceDetailsPage {
    readonly _context = inject(ResourceDetailsPageResourceContext);
    _contextConnection: Subscription;

    readonly resourceType$ = this._context.resourceTypeFromContext$;

    constructor() {
        this._contextConnection = this._context.connect();
    }

    ngOnDestroy() {
        this._contextConnection.unsubscribe();
    }

}