import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'leaveCode' })
export class LeaveCodePipe implements PipeTransform {
  transform(id: number | string | null | undefined): string {
    if (id == null || id === '') return '';
    return 'LV' + String(id).padStart(5, '0');
  }
}
