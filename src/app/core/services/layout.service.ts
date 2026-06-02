import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class LayoutService extends BaseService {
  getMyMenu(): Observable<any> {
    return this.get('MenuItems/GetMyMenu');
  }

  getMyDetails(): Observable<any> {
    return this.get('Home/getmydetails');
  }
}
