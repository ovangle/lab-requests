import { Component, Input } from "@angular/core";
import { User } from "./common/user";

@Component({
    selector: 'user-info',
    standalone: true,
    template: `
    {{user!.name}} <em>{{user!.email}}</em>
    `
})
export class UserInfoComponent {
    @Input({ required: true })
    user: User | undefined;
}