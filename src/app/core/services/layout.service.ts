import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { ApiResponse } from '../../data/models/api-response.model';
import { MenuItem } from '../../data/models/menu-item.model';
import { UserProfile } from '../../data/models/user-profile.model';

@Injectable({
  providedIn: 'root'
})
export class LayoutService extends BaseService {
  getMyMenu(): Observable<ApiResponse<MenuItem[]>> {
    return this.get<MenuItem[]>('MenuItems/GetMyMenu');
  }

  getMyDetails(): Observable<ApiResponse<UserProfile>> {
    return this.get<UserProfile>('Home/getmydetails');
  }
}
