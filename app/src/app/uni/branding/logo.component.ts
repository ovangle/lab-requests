import { Component } from "@angular/core";

@Component({
    selector: 'uni-logo',
    standalone: true,
    template: `
        <img [attr.src]="logoSrc" alt="cqu logo" />
    `
})
export class UniLogoComponent {
    readonly logoSrc = 'https://handbook.cqu.edu.au/img/cqu-logo.png';
}