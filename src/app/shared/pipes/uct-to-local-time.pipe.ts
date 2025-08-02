import { Pipe, PipeTransform } from '@angular/core';
  import { format, toZonedTime } from 'date-fns-tz';

@Pipe({
  name: 'uctToLocalTime'
})
export class UctToLocalTimePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): string {
    if (!value) return '';
    
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const date = toZonedTime(new Date(value as string), localTimezone);
    const dateFmt = format(date, 'yyyy-MM-dd HH:mm:ssXXX', { timeZone: localTimezone });
    return dateFmt;
  }

}
