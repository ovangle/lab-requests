import { Inject, Injectable, InjectionToken, Pipe, PipeTransform } from "@angular/core";
import { Model, ModelService } from "./model-service";

@Pipe({
    name: 'routeTo',
    standalone: true,
})
export class RouteToPipe implements PipeTransform {
    transform(value: Model) {
    }
    
}