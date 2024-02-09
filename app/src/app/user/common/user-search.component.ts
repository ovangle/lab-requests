import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { CommonModule } from "@angular/common";
import { Component, DestroyRef, Input, inject } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { RouterModule } from "@angular/router";
import { Observable } from "rxjs";
import { ModelSearchAutocompleteComponent } from "src/app/common/model/search/search-autocomplete.component";
import { ModelSearchComponent, ModelSearchControl, provideValueAccessor } from "src/app/common/model/search/search-control";
import { ModelSearchInputComponent } from "src/app/common/model/search/search-input-field.component";
import { User, injectUserService } from "./user";


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

        <common-model-search-autocomplete [search]="searchControl" 
            [notFoundTemplate]="userNotFound"/>

        <ng-template #userNotFound>
            The user is not listed <a [routerLink]="['/users/create']">create...</a>
        </ng-template>
    </common-model-search-input-field>
    `,
    providers: [
        provideValueAccessor(UserSearchComponent)
    ]
})
export class UserSearchComponent implements ModelSearchComponent<User> {
    readonly _userService = injectUserService();

    readonly searchControl = new ModelSearchControl<User>(
        (searchInput) => this.getSearchOptions(searchInput),
        (user: User) => this.formatUser(user)
    );
    readonly _destroyRef = inject(DestroyRef);

    getSearchOptions(searchInput: string): Observable<User[]> {
        return this._userService.query({
            search: searchInput || '',
            include_roles: Array.from(this.includeRoles)
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
    includeRoles = new Set<string>();

    @Input()
    get createTemporaryIfNotFound() {
        return this.searchControl.allowNotFound;
    }
    set createTemporaryIfNotFound(value: BooleanInput) {
        this.searchControl.allowNotFound = coerceBooleanProperty(value);
    }
}