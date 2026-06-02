import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class UserAccessService extends BaseService {
  getAccess(userId: number): Observable<any> {
    return this.get(`Users/access/${userId}`);
  }

  updateAccess(userId: number, payload: any): Observable<any> {
    return this.put(`Users/access/${userId}`, payload);
  }
}
