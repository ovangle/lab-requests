import { CommonModule } from "@angular/common";
import { Component, Input, inject } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { ResourceContainerControl } from "./resource-container-control";
import { EquipmentLeaseTableComponent } from "../lab-resources/equipment-lease/equipment-lease-table.component";
import { SoftwareLeaseTableComponent } from "../lab-resources/software-lease/software-resource-table.component";
import { InputMaterialTableComponent } from "../lab-resources/input-material/input-material-resource-table.component";
import { OutputMaterialTableComponent } from "../lab-resources/output-material/output-material-resource-table.component";
import { ResourceContainer, ResourceContainerContext } from "./resource-container";
import { BehaviorSubject, filter } from "rxjs";
import { ResearchFunding } from "src/app/research/funding/research-funding";

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
    @Input({ required: true })
    containerControl: ResourceContainerControl<T> | undefined;
    readonly context = inject(ResourceContainerContext<T>);

    readonly funding$ = this.context.funding$;

    ngOnInit() {
        this.context.attachControl(this.containerControl!);
    }

    ngOnDestroy() {
        this.context.detachControl();
    }

}