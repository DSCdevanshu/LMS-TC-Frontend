import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class RoleService extends BaseService {
  listRoles(): Observable<any> { return this.get('Roles/GetAll'); }
  getRole(id: number): Observable<any> { return this.get(`Roles/GetById/${id}`); }
  createRole(payload: any): Observable<any> { return this.post('Roles/Create', payload); }
  updateRole(id: number, payload: any): Observable<any> { return this.put(`Roles/Update/${id}`, payload); }
  removeRole(id: number): Observable<any> { return this.delete(`Roles/Delete/${id}`); }
  listPermissions(): Observable<any> { return this.get('Permissions'); }
  createPermission(payload: any): Observable<any> { return this.post('Permissions', payload); }
}
