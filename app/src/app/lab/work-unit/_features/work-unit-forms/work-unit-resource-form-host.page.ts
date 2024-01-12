import {
  AfterViewInit,
  Component,
  Injectable,
  OnDestroy,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, map } from 'rxjs';
import { BodyScrollbarHidingService } from 'src/app/utils/body-scrollbar-hiding.service';
import {
  WorkUnitContext,
  WorkUnitResourceContainerContext,
} from '../../common/work-unit';
import { workUnitForm } from '../../common/work-unit-form';
import { ResourceContainerContext } from 'src/app/lab/lab-resource/resource-container';
import {
  ResourceContainerFormService,
  ResourceContainerForm,
} from 'src/app/lab/lab-resource/resource-container-form.service';

@Injectable()
class WorkUnitResourceContainerFormService extends ResourceContainerFormService {
  readonly _formHost = inject(WorkUnitResourceFormHostPage);

  get form(): ResourceContainerForm {
    return this._formHost.form as any;
  }
}

@Component({
  selector: 'lab-work-unit-resource-form-host-page',
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
      provide: ResourceContainerFormService,
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
