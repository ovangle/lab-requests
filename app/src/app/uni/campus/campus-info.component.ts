import { Component, Input } from "@angular/core";
import { Campus } from "./campus";
import { CommonModule } from "@angular/common";

@Component({
    selector: 'app-uni-campus-info',
    standalone: true,
    imports: [
        CommonModule
    ],
    template: `{{campus.name}}` 
})
export class CampusInfoComponent {
    @Input()
    campus: Campus;
}
