import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  Component,
  ContentChildren,
  Injectable,
  Input,
  QueryList,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core';
import {
  MatColumnDef,
  MatTable,
  MatTableModule,
} from '@angular/material/table';
import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { Observable, firstValueFrom, map } from 'rxjs';
import { ActivatedRoute, RouterLink, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { MatButtonModule } from '@angular/material/button';

import { LabResourceConsumerContext, LabResourceContainerContext } from '../../lab-resource-consumer/resource-container';
import { ResourceTypePipe } from '../resource-type.pipe';
import { Resource, ResourceService } from '../resource';
import { ScaffoldFormPaneControl } from 'src/app/scaffold/form-pane/form-pane-control';
import { ResourceType } from '../resource-type';

@Injectable()
export class ResourceTableDataSource<
  T extends Resource,
> extends DataSource<T> {
  readonly _consumerContext = inject(LabResourceConsumerContext);
  readonly _containerContext = inject(LabResourceContainerContext<T, any>);

  readonly resourceType$ = this._containerContext.resourceType$;
  readonly resourceContainer$ = this._containerContext.committed$;

  readonly _formPane = inject(ScaffoldFormPaneControl);

  async openResourceCreateForm(): Promise<boolean> {
    const resourceType = await firstValueFrom(this.resourceType$);
    return this._formPane.open([ 'lab-forms', 'resources', resourceType, 'create' ]);
  }

  async openResourceUpdateFormAt(index: number): Promise<boolean> {
    const resourceType = await firstValueFrom(this.resourceType$);
    return await this._formPane.open([
      'lab',
      'resources',
      resourceType,
      `${index}`,
    ]);
  }

  async getElementAt(elementIndex: number): Promise<T> {
    const container = await firstValueFrom(this.resourceContainer$);
    return container.getResourceAt(elementIndex);
  }

  async deleteElementAt(elementIndex: number): Promise<any> {
    return await this._containerContext.deleteResourceAt(elementIndex);
  }

  override connect(
    collectionViewer: CollectionViewer,
  ): Observable<readonly T[]> {
    return this.resourceContainer$.pipe(map(container => container.items))
  }

  override disconnect(collectionViewer: CollectionViewer): void {
    return;
  }
}

@Component({
  selector: 'lab-resource-table',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    MatButtonModule,
    MatIconModule,
    MatTableModule,

    ResourceTypePipe,
  ],
  templateUrl: './resource-table.component.html',
  styleUrls: [ './resource-table.component.css' ],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: 0 })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
      ),
    ]),
  ],
  providers: [
    LabResourceContainerContext,
    ResourceTableDataSource
  ]
})
export class ResourceTableComponent<T extends Resource>
  implements AfterContentInit {
  readonly _containerContext = inject(LabResourceContainerContext);
  readonly dataSource: ResourceTableDataSource<T> = inject(ResourceTableDataSource<T>);

  route = inject(ActivatedRoute);
  _formPane = inject(ScaffoldFormPaneControl);

  @Input({ required: true })
  resourceType: ResourceType | undefined;

  @Input()
  get displayedColumns(): string[] {
    return this._displayedColumns;
  }
  set displayedColumns(columns: string[]) {
    this._displayedColumns = columns;
    this._displayedColumnsWithElementActions = [ ...columns, 'element-actions' ];
  }

  private _displayedColumns: string[] = [];

  get displayedColumnsWithElementActions(): string[] {
    return this._displayedColumnsWithElementActions;
  }
  private _displayedColumnsWithElementActions: string[] = [];

  @Input()
  detailTemplate: TemplateRef<{ $implicit: Resource; index: number }> | undefined = undefined;

  @ViewChild(MatTable, { static: true })
  private table: MatTable<T> | undefined = undefined;

  @ContentChildren(MatColumnDef)
  private childColumnDefs: QueryList<MatColumnDef> | undefined = undefined;

  expandedElement: T | null = null;

  ngOnInit() {
    this._containerContext.nextContainerType(this.resourceType!);
  }

  ngAfterContentInit(): void {
    this.childColumnDefs!.forEach((defn) => this.table!.addColumnDef(defn));
  }

  expandElementDetail(element: T, event: Event) {
    if (!this.isActionsDisabled) {
      this.expandedElement = element !== this.expandedElement ? element : null;
      event.stopPropagation();
    }
  }

  async deleteElementAt(index: number, event: Event) {
    event.stopPropagation();
    await this.dataSource.deleteElementAt(index);
  }

  openResourceCreateForm(event: Event) {
    this.dataSource.openResourceCreateForm();
    event.stopPropagation();
  }

  openResourceUpdateFormAt(index: number, event: Event) {
    this.dataSource.openResourceUpdateFormAt(index);
    event.stopPropagation();
  }

  get isActionsDisabled(): boolean {
    return this.route.children.length !== 0;
  }
}
