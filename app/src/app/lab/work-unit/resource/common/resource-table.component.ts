import { CommonModule } from "@angular/common";
import { AfterContentInit, Component, ContentChildren, Injectable, Input, QueryList, TemplateRef, ViewChild, inject } from "@angular/core";
import { MatColumnDef, MatTable, MatTableModule } from "@angular/material/table";
import { CollectionViewer, DataSource } from "@angular/cdk/collections";
import { Observable } from "rxjs";
import { ActivatedRoute, RouterLink, RouterModule } from "@angular/router";
import { MatIconModule } from "@angular/material/icon";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { MatButtonModule } from "@angular/material/button";

import { ResourceContainerContext } from "../resource-container";
import { ExperimentalPlanFormPaneControlService } from "src/app/lab/experimental-plan/experimental-plan-form-pane-control.service";
import { ResourceType, ResourceTypePipe } from "../resource-type";
import { Resource } from "../resource";

@Injectable()
export abstract class ResourceTableDataSource<T extends Resource> extends DataSource<T> {
    readonly resourceType: ResourceType;
    readonly resourceTitle: string;

    readonly _containerContext = inject(ResourceContainerContext);
    readonly resourceContainer$ = this._containerContext.committed$;

    readonly _formPane = inject(ExperimentalPlanFormPaneControlService);

    async openResourceCreateForm(): Promise<boolean> {
        const containerPath = await this._containerContext.getContainerPath();
        return this._formPane.open([...containerPath, this.resourceType, 'create']);
    }

    async openResourceUpdateFormAt(index: number): Promise<boolean> {
        const containerPath = await this._containerContext.getContainerPath();
        return this._formPane.open([...containerPath, this.resourceType, `${index}`]);
    }

    deleteElementAt(elementIndex: number): void {
        this._containerContext.deleteResourceAt(this.resourceType, elementIndex);
    }

    override connect(collectionViewer: CollectionViewer): Observable<readonly T[]> {
        return this._containerContext.committedResources$<T>(this.resourceType);
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

        ResourceTypePipe
    ],
    templateUrl: './resource-table.component.html',
    styleUrls: [
        './resource-table.component.css'
    ],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({height: '0px', minHeight: 0})),
            state('expanded', style({height: '*'})),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
        ])
    ]
})
export class ResourceTableComponent<T extends Resource> implements AfterContentInit {
    dataSource: ResourceTableDataSource<T> = inject(ResourceTableDataSource);

    route = inject(ActivatedRoute);
    _formPane = inject(ExperimentalPlanFormPaneControlService)

    @Input()
    get displayedColumns(): string[] {
        return this._displayedColumns;
    }
    set displayedColumns(columns: string[]) {
        this._displayedColumns = columns;
        this._displayedColumnsWithElementActions = [...columns, 'element-actions'];
    }

    private _displayedColumns: string[]

    get displayedColumnsWithElementActions(): string[] {
        return this._displayedColumnsWithElementActions;
    }
    private _displayedColumnsWithElementActions: string[];

    @Input()
    detailTemplate: TemplateRef<{$implicit: Resource, index: number}>;

    @ViewChild(MatTable, {static: true})
    private table: MatTable<T>;

    @ContentChildren(MatColumnDef)
    private childColumnDefs: QueryList<MatColumnDef>;

    expandedElement: T | null = null;

    ngAfterContentInit(): void {
        this.childColumnDefs.forEach(defn => this.table.addColumnDef(defn))
    }

    expandElementDetail(element: T, event: Event) {
        if (!this.isActionsDisabled) {
            this.expandedElement = element !== this.expandedElement ? element : null;
            event.stopPropagation();
        }
    }

    deleteElementAt(index: number, event: Event) {
        this.dataSource.deleteElementAt(index);
        event.stopPropagation();
    }

    openResourceCreateForm(event: Event) {
        this.dataSource.openResourceCreateForm().then(
            success => console.log('opened')
        );
        event.stopPropagation()
    }

    openResourceUpdateFormAt(index: number, event: Event) {
        this.dataSource.openResourceUpdateFormAt(index).then(
            success => console.log('opened update form')
        );
        event.stopPropagation()
    }

    get isActionsDisabled(): boolean {
        return this.route.children.length !== 0;
    }
}