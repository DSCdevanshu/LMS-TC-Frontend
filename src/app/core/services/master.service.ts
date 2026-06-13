import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class MasterService extends BaseService {
  // Companies
  getCompanies(): Observable<any> { return this.get('Master/companies'); }
  createCompany(payload: any): Observable<any> { return this.post('Master/companies', payload); }
  updateCompany(id: number, payload: any): Observable<any> { return this.put(`Master/companies/${id}`, payload); }
  deleteCompany(id: number): Observable<any> { return this.delete(`Master/companies/${id}`); }

  // Locations
  getLocations(): Observable<any> { return this.get('Master/locations'); }
  createLocation(payload: any): Observable<any> { return this.post('Master/locations', payload); }
  updateLocation(id: number, payload: any): Observable<any> { return this.put(`Master/locations/${id}`, payload); }
  deleteLocation(id: number): Observable<any> { return this.delete(`Master/locations/${id}`); }

  // Holidays
  getHolidays(): Observable<any> { return this.get('Master/holidays'); }
  createHoliday(payload: any): Observable<any> { return this.post('Master/holidays', payload); }
  updateHoliday(id: number, payload: any): Observable<any> { return this.put(`Master/holidays/${id}`, payload); }
  deleteHoliday(id: number): Observable<any> { return this.delete(`Master/holidays/${id}`); }
}
