import { AbstractControl, FormGroup } from "@angular/forms";


export function disabledStateToggler(control: AbstractControl<any>) {
    return (isDisabled: boolean) => {
        if (isDisabled && !control.disabled) {
            control.disable();
        }
        if (!isDisabled && control.disabled) {
            control.enable();
        }
    }
}

export function groupDisabledStateToggler<TControl extends {[K in keyof TControl]: AbstractControl<any>}>(group: FormGroup<TControl>, disableControls: Array<keyof TControl>) {
    const controlTogglers = disableControls.map(
        (k: keyof TControl) => disabledStateToggler((group.controls as TControl)[k])
    );

    return (isDisabled: boolean) => {
        controlTogglers.forEach(toggler => toggler(isDisabled))
    };
}