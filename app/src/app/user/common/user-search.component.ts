import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { CommonModule } from "@angular/common";
import { Component, DestroyRef, Input, inject } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { RouterModule } from "@angular/router";
import { Observable } from "rxjs";
import { ModelSearchAutocompleteComponent } from "src/app/common/model/search/search-autocomplete.component";
import { ModelSearchComponent, ModelSearchControl, provideModelSearchValueAccessor } from "src/app/common/model/search/search-control";
import { ModelSearchInputComponent } from "src/app/common/model/search/search-input-field.component";
import { User, UserService } from "./user";
import { Discipline } from "src/app/uni/discipline/discipline";


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
    <common-model-search-input-field [search]="searchControl"
        [required]="required">
        <mat-label><ng-content select="mat-label" /></mat-label>

        <common-model-search-autocomplete [notFoundTemplate]="userNotFound"/>

        <ng-template #userNotFound>
            The user is not listed <a routerLink="/user/create-temporary">create...</a>
        </ng-template>
    </common-model-search-input-field>
    `,
    providers: [
        provideModelSearchValueAccessor(UserSearchComponent)
    ]
})
export class UserSearchComponent implements ModelSearchComponent<User> {
    readonly _userService = inject(UserService);

    readonly searchControl = new ModelSearchControl<User>(
        (searchInput) => this.getSearchOptions(searchInput),
        (user: User) => this.formatUser(user)
    );
    readonly _destroyRef = inject(DestroyRef);

    getSearchOptions(searchInput: string): Observable<User[]> {
        return this._userService.query({
            search: searchInput,
            discipline: this.discipline,
            includeRoles: Array.from(this.includeRoles)
        })
    }

    formatUser(user: User) {
        return `${user.name} (${user.email})`
    }

    @Input()
    get required(): boolean {
        return this._required;
    }
    set required(value: BooleanInput) {
        this._required = coerceBooleanProperty(value);
    }
    private _required: boolean = false;

    /**
     * Roles to restrict the user search to.
     */
    @Input()
    get includeRoles(): Set<string> {
        return this._includeRoles;
    }
    set includeRoles(roles: string | string[] | Set<string>) {
        if (typeof roles === 'string') {
            roles = roles.split(',');
        }
        this._includeRoles.clear()
        for (const role of roles) {
            this._includeRoles.add(role);
        }
    }
    _includeRoles = new Set<string>();

    /**
     * Restrict the search to users of the given discipline.
     */
    @Input()
    discipline: Discipline | undefined;

    @Input()
    get createTemporaryIfNotFound() {
        return this.searchControl.allowNotFound;
    }
    set createTemporaryIfNotFound(value: BooleanInput) {
        this.searchControl.allowNotFound = coerceBooleanProperty(value);
    }
}