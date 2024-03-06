import { Component, Input } from "@angular/core";
import { User } from "./common/user";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";

@Component({
    selector: 'user-info',
    standalone: true,
    template: `
    {{user!.name}} @if (!nameonly) { <em>{{user!.email}}</em> }
    `
})
export class UserInfoComponent {
    @Input({ required: true })
    user: User | undefined;

    @Input()
    get nameonly(): boolean {
        return this._nameonly
    }
    set nameonly(value: BooleanInput) {
        this._nameonly = coerceBooleanProperty(value);
    }
    _nameonly: boolean = false;
}