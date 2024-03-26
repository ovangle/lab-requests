import { CommonModule } from "@angular/common";
import { Component, Input, inject } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { EquipmentLeaseTableComponent } from "../lab-resources/equipment-lease/equipment-lease-table.component";
import { SoftwareLeaseTableComponent } from "../lab-resources/software-lease/software-resource-table.component";
import { InputMaterialTableComponent } from "../lab-resources/input-material/input-material-resource-table.component";
import { OutputMaterialTableComponent } from "../lab-resources/output-material/output-material-resource-table.component";
import { ResourceContainer, ResourceContainerContext } from "./resource-container";
import { BehaviorSubject, Subscription, filter } from "rxjs";
import { ResearchFunding } from "src/app/research/funding/research-funding";
import { ModelContext } from "src/app/common/model/context";

@Component({
    selector: 'lab-resource-container-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        EquipmentLeaseTableComponent,
        SoftwareLeaseTableComponent,
        InputMaterialTableComponent,
        OutputMaterialTableComponent
    ],
    template: `
    @if (funding$ | async; as funding) {
        <div class="equipment-lease-table-container">
            <lab-equipment-lease-table />
        </div>
            
        <div class="software-lease-table-container">
            <lab-software-lease-table />
        </div>

        <div class="input-material-table-container">
            <lab-input-material-table />
        </div>

        <div class="output-material-table-container">
            <lab-output-material-table />
        </div>
    } @else {
        <p>Requirements not available until funding has been set for the research plan</p>
    }
    `
})
export class LabResourceContainerFormComponent<T extends ResourceContainer> {
    readonly containerContext = inject(ResourceContainerContext<T>);

    @Input({ required: true })
    modelContext: ModelContext<T> | undefined;
    _attachedContainer: Subscription | undefined;

    readonly funding$ = this.containerContext.funding$;

    ngOnInit() {
        this._attachedContainer = this.containerContext.attachContext(this.modelContext!);
    }

    ngOnDestroy() {
        this._attachedContainer!.unsubscribe();
    }

}