import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { Campus } from "./common/campus";

@Component({
    selector: 'uni-campus-info',
    standalone: true,
    imports: [
        CommonModule
    ],
    template: `
        @if (!nameOnly) {
            <span class="campus-code">{{campus.code}}</span> - 
        }
        {{campus.name}}
    ` 
})
export class CampusInfoComponent {
    @Input()
    campus: Campus;

    @Input()
    get nameOnly(): boolean {
        return this._nameOnly;
    }
    set nameOnly(input: BooleanInput) {
        this._nameOnly = coerceBooleanProperty(input);
    }
    
    _nameOnly: boolean = false;
}
