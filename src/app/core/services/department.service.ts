import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class DepartmentService extends BaseService {
  list(): Observable<any> { return this.get('Departments'); }
  getById(id: number): Observable<any> { return this.get(`Departments/${id}`); }
  create(payload: any): Observable<any> { return this.post('Departments', payload); }
  update(id: number, payload: any): Observable<any> { return this.put(`Departments/${id}`, payload); }
  remove(id: number): Observable<any> { return this.delete(`Departments/${id}`); }
}
