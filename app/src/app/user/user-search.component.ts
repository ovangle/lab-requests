import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { CommonModule } from "@angular/common";
import { Component, DestroyRef, Input, inject, input } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { RouterModule } from "@angular/router";
import { Observable } from "rxjs";
import { ModelSearchAutocompleteComponent } from "src/app/common/model/search/search-autocomplete.component";
import { ModelSearchComponent, ModelSearchControl, NotFoundValue } from "src/app/common/model/search/search-control";
import { ModelSearchInputComponent } from "src/app/common/model/search/search-input.component";
import { User, UserService } from "./user";
import { Discipline } from "src/app/uni/discipline/discipline";

let _currentId = 0;
function _nextControlId() {
    return _currentId++;
}


@Component({
    selector: 'user-search',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,

        MatFormFieldModule,

        ModelSearchInputComponent,
        ModelSearchAutocompleteComponent
    ],
    template: `
        <common-model-search-input
            [searchControl]="searchControl"
            [required]="_required()"
            [modelSearchAutocomplete]="autocomplete">

        <common-model-search-autocomplete #autocomplete
            [searchControl]="searchControl"
            [allowNotFound]="allowNotFound()"
            [notFoundTemplate]="userNotFound" />

        <ng-template #userNotFound>
            The user is not listed <a routerLink="/user/create-temporary">create...</a>
        </ng-template>
    `,
})
export class UserSearchComponent extends ModelSearchComponent<User> {
    readonly controlType = 'user-search';
    readonly id = `${this.controlType}-${_nextControlId()}`;

    readonly _userService = inject(UserService);

    constructor() {
        const searchControl = new ModelSearchControl<User>(
            (searchInput) => this.getSearchOptions(searchInput),
            (user: User | NotFoundValue) => this.formatUser(user)
        );
        super(searchControl);
    }

    readonly _destroyRef = inject(DestroyRef);

    getSearchOptions(searchInput: string): Observable<User[]> {
        return this._userService.query({
            search: searchInput,
            discipline: this.discipline(),
            includeRoles: Array.from(this.includeRoles())
        })
    }

    formatUser(user: User | NotFoundValue) {
        if (user instanceof User) {
            return `${user.name} (${user.email})`
        } else {
            return `not found: ${user.searchInput}`;
        }
    }

    allowNotFound = input(false, { transform: coerceBooleanProperty });

    /**
     * Roles to restrict the user search to.
     */
    includeRoles = input<string[]>([]);
    /**
     * Restrict the search to users of the given discipline.
    */
    discipline = input<Discipline>();
}