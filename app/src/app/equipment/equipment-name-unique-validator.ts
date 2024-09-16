import { inject, Injectable } from "@angular/core";
import { EquipmentService } from "./equipment";
import { BehaviorSubject, debounceTime, distinctUntilChanged, firstValueFrom, shareReplay, switchMap } from "rxjs";
import { AbstractControl, AsyncValidator, ValidationErrors } from "@angular/forms";

@Injectable({ providedIn: 'root' })
export class EquipmentNameUniqueValidator implements AsyncValidator {
    readonly equipments = inject(EquipmentService);
    readonly valueSubject = new BehaviorSubject<string>('');

    readonly matches = this.valueSubject.pipe(
        distinctUntilChanged(),
        debounceTime(300),
        switchMap(value => this.equipments.query({ name: value })),
        shareReplay(1)
    );

    async validate(control: AbstractControl<any, any>): Promise<ValidationErrors | null> {
        const value = control.value;
        if (typeof value === 'string') {
            this.valueSubject.next(value);
        }
        const matches = await firstValueFrom(this.matches);
        if (matches.length > 0) {
            return { unique: 'equipment name not unqiue' };
        }
        return null;
    }
}