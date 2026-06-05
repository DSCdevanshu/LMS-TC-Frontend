import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class EmployeeService extends BaseService {
  getDropdownData(flag: string): Observable<any> {
    const params = new HttpParams().set('flag', flag);
    return this.get('Home/GetDropdownData', params);
  }

  list(filter: any): Observable<any> {
    return this.post('Employees/GetEmployeeList', filter ?? {});
  }

  getEmployees(filter: any): Observable<any> {
    return this.list(filter);
  }

  getById(id: number): Observable<any> {
    return this.get(`Employees/GetEmployeeById/${id}`);
  }

  update(id: number, payload: any): Observable<any> {
    return this.put(`Employees/UpdateEmployee/${id}`, payload);
  }

  remove(id: number): Observable<any> {
    return this.delete(`Employees/deleteEmployee/${id}`);
  }

  updatePhoto(id: number, photo: File): Observable<any> {
    const fd = new FormData();
    fd.append('Photo', photo);
    return this.http.put<any>(`${this.baseUrl}/Employees/UpdateEmployeePhoto/${id}`, fd);
  }

  removePhoto(id: number): Observable<any> {
    return this.delete(`Employees/RemoveEmployeePhoto/${id}`);
  }

  assignManager(payload: any): Observable<any> {
    return this.post('Hierarchy/assign-manager', payload);
  }

  removeManager(payload: any): Observable<any> {
    return this.http.request<any>('DELETE', `${this.baseUrl}/Hierarchy/remove-manager`, { body: payload });
  }

  /**
   * Build FormData from a plain object and POST. Pass any object whose keys
   * map to backend form-field names. File values are appended as files.
   * Arrays are appended one entry at a time (same key).
   */
  createEmployee(payload: any): Observable<any> {
    const fd = new FormData();
    Object.keys(payload || {}).forEach((key) => {
      const val = payload[key];
      if (val === undefined || val === null) return;
      if (Array.isArray(val)) {
        val.forEach((item) => fd.append(key, item instanceof File ? item : String(item)));
      } else if (val instanceof File) {4
        fd.append(key, val);
      } else {
        fd.append(key, String(val));
      }
    });
    return this.http.post<any>(`${this.baseUrl}/Employees/CreateEmployee`, fd);
  }
}
