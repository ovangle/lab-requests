import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { Task as Task } from "./task";


@Component({
    selector: 'lab-task-resource-details',
    standalone: true,
    imports: [
        CommonModule
    ],
    template: ``
})
export class TaskResourceDetailsComponent {
    @Input()
    task: Task;
}