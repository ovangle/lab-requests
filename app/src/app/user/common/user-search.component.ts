import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { CommonModule } from "@angular/common";
import { Component, DestroyRef, Input, TemplateRef, inject } from "@angular/core";
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule, RequiredValidator } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatFormFieldModule } from "@angular/material/form-field";
import { Observable, debounceTime, filter, firstValueFrom, map, of, shareReplay, startWith, switchMap } from "rxjs";
import { CreateTemporaryUserRequest, CreateTemporaryUserResult, User, UserLookup, UserService, injectUserService } from "./user";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatInputModule } from "@angular/material/input";
import { CreateTemporaryUserFlowComponent } from "../temporary-user/user-temporary-user-flow.component";
import { RouterModule } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";


@Component({
    selector: 'user-search',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,

        MatAutocompleteModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
    ],
    template: `
    <mat-form-field>
        <mat-label>
            <ng-content select="mat-label"></ng-content>
        </mat-label>

        <input 
            matInput
            [matAutocomplete]="autocomplete"
            [required]="required" 
            [formControl]="selectedUserControl" />

        <button mat-icon-button matIconSuffix
            (click)="selectedUserControl.setValue(null)">
            <mat-icon>close</mat-icon>
        </button>
        
        <mat-error>
            <ng-content select="mat-error"></ng-content>
        </mat-error>
    </mat-form-field>      

    <mat-autocomplete #autocomplete [displayWith]="_displayUser">
        @if (autocompleteOptions$ | async; as autocompleteOptions) {
            @for (user of autocompleteOptions; track user.id) {
                <mat-option [value]="user">
                    {{user.name}} 
                </mat-option>
 
            }
            @if (autocompleteOptions.length < 5 && createTemporaryIfNotFound && selectedUserId == null) {
                <mat-option value="_NOT_FOUND_">
                    The user isn't listed <a [routerLink]="['/user', 'create-temporary']">Create</a>
                </mat-option>
            }
        }
   </mat-autocomplete>

    <!--
    @if (createTemporaryIfNotFound && isCreatingTemporaryUser) {
        <user-create-temporary-user
            (userCreated)="_onTemporaryUserCreated($event)">
        </user-create-temporary-user>
    }
    -->

    `,
    providers: [
        { provide: NG_VALUE_ACCESSOR, multi: true, useExisting: UserSearchComponent }
    ]
})
export class UserSearchComponent implements ControlValueAccessor {
    readonly _userService = injectUserService();
    readonly _destroyRef = inject(DestroyRef);
    readonly selectedUserControl = new FormControl<User | CreateTemporaryUserResult | string | null>(null);

    readonly autocompleteOptions$: Observable<User[]> = this.selectedUserControl.valueChanges.pipe(
        takeUntilDestroyed(),
        debounceTime(300),
        startWith(''),
        switchMap((value) => {
            if (value instanceof User) {
                return of([ value ]);
            } else if (value == null || typeof value === 'string' && value !== '_NOT_FOUND_') {
                return this._userService.query({
                    search: value || '',
                    include_roles: Array.from(this.includeRoles)
                })
            } else {
                return of([]);
            }
        }),
        shareReplay(1)
    );
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
        return this._createTemporaryIfNotFound;
    }
    set createTemporaryIfNotFound(value: BooleanInput) {
        this._createTemporaryIfNotFound = coerceBooleanProperty(value);
    }
    _createTemporaryIfNotFound: boolean = false;

    get isCreatingTemporaryUser() {
        return this.selectedUserControl.value != null && !(this.selectedUserControl.value instanceof User);
    }

    get selectedUserId(): string | null {
        if (this.selectedUserControl.value instanceof User) {
            return this.selectedUserControl.value.id;
        }
        return null;
    }

    ngOnInit() {
        const changeSubscription = this.selectedUserControl.valueChanges
            .subscribe((value: User | CreateTemporaryUserResult | string | null) => {
                if (typeof value === 'string') {
                    return;
                } else if (value == null) {
                    this._onChange(null);
                } else if (value instanceof User) {
                    this._onChange({ email: value.email });
                } else {
                    this._onChange({ email: value.user.email });
                }
            });
        this._destroyRef.onDestroy(() => {
            changeSubscription.unsubscribe();
        })
    }

    writeValue(obj: UserLookup | string | null): void {
        if (obj == null) {
            this.selectedUserControl.setValue(null);
            return;
        } else if (typeof obj === 'string' || obj[ 'id' ]) {
            const userId = typeof obj === 'string' ? obj : obj[ 'id' ]!;
            if (this.selectedUserId === userId) {
                return;
            }
        }
        firstValueFrom(this._userService.lookup(obj)).then(user => {
            if (user == null) {
                console.warn(`Search value ${obj} was bound to non-existent user`)
            }
            this.selectedUserControl.setValue(user);
        });

    }
    _onChange = (value: UserLookup | null) => { };
    registerOnChange(fn: any): void {
        this._onChange = fn;
    }
    _onTouched = () => { };
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }
    setDisabledState = disabledStateToggler(this.selectedUserControl);

    _displayUser(value: any) {
        console.log('value', value);
        if (value == null) {
            return '';
        } else if (value == '_NOT_FOUND_') {
            return 'Creating...';
        } else {
            return `${value.name} (${value.email})`;
        }
    }

    _onTemporaryUserCreated(user: CreateTemporaryUserResult) {
        this.selectedUserControl.setValue(user);
    }
}