import {
  AfterViewInit,
  Component,
  Injectable,
  OnDestroy,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription, map } from 'rxjs';
import { BodyScrollbarHidingService } from 'src/app/utils/body-scrollbar-hiding.service';
import {
  WorkUnitContext,
  WorkUnitResourceContainerContext,
} from '../../common/work-unit';
import { workUnitForm } from '../../common/work-unit-form';
import { ResourceContainerContext } from 'src/app/lab/lab-resource/resource-container';
import {
  ResourceContainerControl,
  ResourceContainerForm,
} from 'src/app/lab/lab-resource/resource-container-form-control';
import { CommonModule } from '@angular/common';

@Injectable()
class WorkUnitResourceContainerFormService extends ResourceContainerControl {
  readonly _formHost = inject(WorkUnitResourceFormHostPage);
}

@Component({
  selector: 'lab-work-unit-resource-form-host-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  template: ` <router-outlet></router-outlet> `,
  host: {
    class: 'mat-elevation-z8',
  },
  styleUrls: [ './work-unit-form.css' ],
  providers: [
    {
      provide: ResourceContainerContext,
      useClass: WorkUnitResourceContainerContext,
    },
    {
      provide: ResourceContainerControl,
      useClass: WorkUnitResourceContainerFormService,
    },
  ],
})
export class WorkUnitResourceFormHostPage {
  _workUnitContext = inject(WorkUnitContext);

  readonly form = workUnitForm();
  readonly appScaffold = inject(BodyScrollbarHidingService);

  constructor() {
    this._workUnitContext.workUnit$
      .subscribe((workUnit) => {
        this.form.patchValue(workUnit);
      });
  }
}
