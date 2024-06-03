import { Directive } from "@angular/core";
import { ModelIndex } from "./model-index";
import { Model, ModelQuery } from "./model";


@Directive()
export abstract class AbstractModelIndexPageDirective<T extends Model, TQuery extends ModelQuery<T>> {
    abstract readonly index: ModelIndex<T, TQuery>;

    get page$() { return this.index.page$; }
    get pageItems$() { return this.index.pageItems$; }
}