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
    @if (funding) {
        <div class="equipment-lease-table-container">
            <h3>Equipment leases</h3>
            <lab-equipment-lease-table />
        </div>
            
        <div class="software-lease-table-container">
            <h3>Software</h3>
            <lab-software-lease-table />
        </div>

        <div class="input-material-table-container">
            <h3>Input materials</h3>
            <lab-input-material-table />
        </div>

        <div class="output-material-table-container">
            <h3>Output materials</h3>
            <lab-output-material-table />
        </div>
    } @else {
        <p>Requirements not available until funding has been set for the research plan</p>
    }
    `
})
export class LabResourceContainerFormComponent {
    containerControl: ResourceContainerControl | undefined;
    readonly context = inject(ResourceContainerContext);

    _fundingSubject = new BehaviorSubject<ResearchFunding | null>(null);
    @Input()
    get funding(): ResearchFunding | null {
        return this._fundingSubject.value;
    }
    set funding(funding: ResearchFunding | null) {
        this._fundingSubject.next(funding);
    }

    @Input({ required: true })
    container: ResourceContainer | null = null;

    ngOnInit() {
        this.containerControl = new ResourceContainerControl(
            this.container,
            this._fundingSubject.pipe(
                filter((f): f is ResearchFunding => f != null)
            ),
            (patch) => {
                throw new Error('not implemented');
            }
        );
        this.context.attachControl(this.containerControl);
    }

    ngOnDestroy() {
        this.context.detachControl();
    }

}