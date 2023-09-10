import { Component, Input } from "@angular/core";
import { Campus } from "./campus";
import { CommonModule } from "@angular/common";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";

@Component({
    selector: 'uni-campus-info',
    standalone: true,
    imports: [
        CommonModule
    ],
    template: `
        <ng-container *ngIf="!nameOnly">
            <span class="campus-code">{{campus.code}}</span> - 
        </ng-container>
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
