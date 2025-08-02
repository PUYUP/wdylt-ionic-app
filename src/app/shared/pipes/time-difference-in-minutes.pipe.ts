import { Pipe, PipeTransform } from '@angular/core';
import { differenceInMinutes } from 'date-fns';

@Pipe({
  name: 'timeDifferenceInMinutes'
})
export class TimeDifferenceInMinutesPipe implements PipeTransform {

  transform(value: string, ...args: string[]): number {
    if (!value || !args[0]) return 0;

    const start = new Date(value);
    const end = new Date(args[0]);
    return differenceInMinutes(end, start);
  }

}
