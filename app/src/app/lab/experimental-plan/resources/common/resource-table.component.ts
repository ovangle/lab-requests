import { CommonModule } from "@angular/common";
import { AfterContentInit, Component, ContentChildren, Injectable, Input, QueryList, TemplateRef, ViewChild, inject } from "@angular/core";
import { MatColumnDef, MatTable, MatTableModule } from "@angular/material/table";
import { Resource, ResourceType, resourceTypeName } from "./resource";
import { CollectionViewer, DataSource } from "@angular/cdk/collections";
import { Observable } from "rxjs";
import { ActivatedRoute, RouterLink, RouterModule } from "@angular/router";
import { MatIconModule } from "@angular/material/icon";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { MatButtonModule } from "@angular/material/button";
import { ExperimentalPlanModelService } from "../../experimental-plan/experimental-plan";
import { ResourceContainerFormService } from "../resource-container";

@Injectable()
export abstract class ResourceTableDataSource<T extends Resource> extends DataSource<T> {
    readonly resourceType: ResourceType;
    readonly resourceTitle: string;

    readonly resourceContainerService = inject(ResourceContainerFormService);


    getCreateLink(): any[] {
        return ['../../', {outlets: {form: [this.resourceType, 'create']}}]
    }

    getUpdateLink(elementIndex: number): any[] {
        return ['./', {outlets: {form: [this.resourceType, 'update', `${elementIndex}`]}}];
    }

    deleteElementAt(elementIndex: number): void {
        this.resourceContainerService.deleteResourceAt(this.resourceType, elementIndex);
    }

    override connect(collectionViewer: CollectionViewer): Observable<readonly T[]> {
        return this.resourceContainerService.getResources$(this.resourceType);
    }

    override disconnect(collectionViewer: CollectionViewer): void {
        return;
    }
}

@Component({
    selector: 'lab-req-resource-table',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,

        MatButtonModule,
        MatIconModule,
        MatTableModule
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

    get isActionsDisabled(): boolean {
        return this.route.children.length !== 0;
    }

    _resourceTypeName(t: ResourceType) {
        return resourceTypeName(t);
    }
}