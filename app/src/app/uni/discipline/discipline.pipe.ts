import { Pipe, PipeTransform } from '@angular/core';
import { Discipline, formatDiscipline } from './discipline';

@Pipe({
  name: 'uniDiscipline',
  standalone: true
})
export class DisciplinePipe implements PipeTransform {
  transform(value: Discipline, ...args: any[]) {
    return formatDiscipline(value);
  }

}
