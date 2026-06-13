import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class DashboardService extends BaseService {
  birthdays(): Observable<any> {
    return this.get('Dashboard/birthdays');
  }

  anniversaries(): Observable<any> {
    return this.get('Dashboard/anniversaries');
  }

  holidays(): Observable<any> {
    return this.get('Dashboard/holidays');
  }

  announcements(): Observable<any> {
    return this.get('Dashboard/announcements');
  }

  policies(): Observable<any> {
    return this.get('Dashboard/policies');
  }
}
