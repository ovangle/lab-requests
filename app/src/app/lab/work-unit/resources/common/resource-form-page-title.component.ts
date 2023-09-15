import { Component, Input } from "@angular/core";
import { ResourceType, ResourceTypePipe } from "./resource";
import { CommonModule } from "@angular/common";

@Component({
    selector: 'lab-resource-form-page-title',
    standalone: true,
    imports: [
        CommonModule,
        ResourceTypePipe
    ],
    template: `
    <h1> 
        {{ index === 'create' ? 'Create' : 'Update'}}
        {{ resourceType | resourceType: 'titleCase' }}
    </h1>
    `
})
export class ResourceFormPageTitleComponent {
    @Input({required: true})
    resourceType: ResourceType;

    @Input()
    index: number | 'create'
}