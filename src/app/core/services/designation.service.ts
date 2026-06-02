import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class DesignationService extends BaseService {
  list(): Observable<any> { return this.get('Designations'); }
  getById(id: number): Observable<any> { return this.get(`Designations/${id}`); }
  create(payload: any): Observable<any> { return this.post('Designations', payload); }
  update(id: number, payload: any): Observable<any> { return this.put(`Designations/${id}`, payload); }
  remove(id: number): Observable<any> { return this.delete(`Designations/${id}`); }
}
