import { Injectable, Injectable, forwardRef, inject } from "@angular/core";
import { Subscription } from "rxjs";
import { SidenavMenuGroupControl, SidenavMenuRoot, } from "src/app/scaffold/sidenav-menu.service";


@Injectable({providedIn: 'root'})
export class SidenavMenu__Lab extends SidenavMenuGroupControl {
    readonly rootMenu = inject(SidenavMenuRoot);
    readonly _connection: Subscription;

    constructor() {
        super('lab', 'Labs');
    }

    _ensureRegistered(): Subscription {
        return this.rootMenu.registerSubgroup(this);
    }
}


@Injectable({providedIn: 'root'})
export class SidenavMenu__Lab__Equipment extends SidenavMenuGroupControl {
    readonly labMenu = inject(SidenavMenu__Lab)

    constructor() {
        super('lab-equipment', 'Equipment');
    }
}

@Injectable({providedIn: 'root'})
export class SidenavMenu__Lab__ExperimentalPlans extends SidenavMenuGroupControl {
    readonly labMenu = inject(SidenavMenu__Lab);

    constructor() {
        super('lab-plans', 'Plans');
    }
}

