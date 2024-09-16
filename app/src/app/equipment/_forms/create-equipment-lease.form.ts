import { ChangeDetectionStrategy, Component, DestroyRef, inject } from "@angular/core";
import { EquipmentLeaseFormComponent } from "../lease/equipment-lease-form.component";
import { CommonModule } from "@angular/common";
import { EquipmentFormComponent } from "../equipment-form.component";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Equipment, EquipmentService } from "../equipment";
import { NotFoundValue } from "src/app/common/model/search/search-control";
import { EquipmentSearchComponent } from "../equipment-search.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ActivatedRoute, Router } from "@angular/router";
import { Lab, LabService } from "src/app/lab/lab";
import { combineLatest, firstValueFrom, map, Observable, of, shareReplay, startWith, switchMap } from "rxjs";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { ScaffoldFormPaneControl } from "src/app/scaffold/form-pane/form-pane-control";
import { LabSearchComponent } from "src/app/lab/lab-search.component";
import { query } from "@angular/animations";
import { Discipline, isDiscipline } from "src/app/uni/discipline/discipline";
import { LabInfoComponent } from "src/app/lab/lab-info.component";
import { EquipmentInstallationService } from "../installation/equipment-installation";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { CreateEquipmentLease, EquipmentLease, EquipmentLeaseService } from "../lease/equipment-lease";
import { LabAllocationConsumer, LabAllocationConsumerService } from "src/app/lab/common/allocatable/lab-allocation-consumer";

function maybeLeaseFromRoute(): Observable<EquipmentLease | null> {
    const activatedRoute = inject(ActivatedRoute);
    const equipmentLeaseService = inject(EquipmentLeaseService);

    return activatedRoute.paramMap.pipe(
        map(queryParams => queryParams.get('lease')),
        switchMap(leaseId => {
            if (leaseId) {
                return equipmentLeaseService.fetch(leaseId);
            }
            return of(null);
        })
    )

}

function allocationConsumerFromRoute(): Observable<LabAllocationConsumer> {
    const activatedRoute = inject(ActivatedRoute);
    const allocationConsumerService = inject(LabAllocationConsumerService)

    const lease = maybeLeaseFromRoute();



    return maybeLeaseFromRoute().pipe(
        switchMap(lease => {
            let consumerTypeId: Observable<[string, string]>;
            if (lease != null) {
                consumerTypeId = of([lease.consumerType, lease.consumerId]);
            } else {
                const consumerType = activatedRoute.queryParamMap.pipe(
                    map(paramMap => {
                        const consumerType = paramMap.get('consumer_t');
                        if (!consumerType) {
                            throw new Error(`Either 'lease' or 'consumer_t' must be present in route query params`)
                        }
                        return consumerType;
                    })
                );
                const consumerId = activatedRoute.queryParamMap.pipe(
                    map(paramMap => {
                        const consumerId = paramMap.get('consumer');
                        if (!consumerId) {
                            throw new Error(`Either 'lease' or 'consumer' must be present in route query params`);
                        }
                        return consumerId;
                    })
                );

                consumerTypeId = combineLatest([
                    consumerType,
                    consumerId
                ]);
            }

            return consumerTypeId.pipe(
                switchMap(([type, id]) => {
                    return allocationConsumerService.fetchForTypeId(type, id);
                }),
                shareReplay(1)
            );
        })
    );
}

function labHintFromRoute() {
    const activatedRoute = inject(ActivatedRoute);
    const labService = inject(LabService);
    return activatedRoute.queryParamMap.pipe(
        map(params => params.get('lab')),
        switchMap(labId => {
            return labId ? labService.fetch(labId) : of(undefined);
        }),
        shareReplay(1)
    );
}

function disciplineHintFromRoute(): Observable<Discipline[]> {
    const activatedRoute = inject(ActivatedRoute);

    return activatedRoute.queryParamMap.pipe(
        map(params => params.get('discipline')),
        map(d => {
            if (typeof d === 'string') {
                const ds = d.split(',').filter(isDiscipline);
                return ds;
            }
            return []
        }),
        shareReplay(1)
    );
}

@Component({
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCheckboxModule,
        MatIconModule,

        EquipmentSearchComponent,
        EquipmentFormComponent,
        LabInfoComponent,
        LabSearchComponent,

        EquipmentLeaseFormComponent
    ],
    template: `
    <h3>Reserve equipment</h3>

    @if (allocationConsumer$ | async; as consumer) {
        <equipment-lease-form
            [consumer]="consumer" />
    }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EquipmentLeaseFormPage {
    formPane = inject(ScaffoldFormPaneControl)
    router = inject(Router);
    _equipmentLeaseService = inject(EquipmentLeaseService);

    lease$ = maybeLeaseFromRoute();
    allocationConsumer$ = allocationConsumerFromRoute();
    labHint$ = labHintFromRoute();
    disciplineHint$ = disciplineHintFromRoute();

    async _onSubmit(request: CreateEquipmentLease) {
        this._equipmentLeaseService.create(request).subscribe(lease => {
            this.router.navigate(['/equipment', 'lease', lease.id])
        });


    }
}