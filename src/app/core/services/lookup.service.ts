import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';

export const LookupFlags = {
  Departments: 'GetDepartmentDropdown',
  Designations: 'GetDesignationDropdown',
  Employees: 'GetAllEmployeesDropDown',
  Managers: 'GetAllEmployeesDropDown',
  LeaveTypes: 'GetLeaveTypeDropdown',
  LeaveProcess: 'GetLeaveProcessDropdown',
  Roles: 'GetRolesDropdown',
  AuthorizedEmployees: 'GetAuthorizedEmployeesDropDown',
  AuthorizedDepartments: 'GetAuthorizedDepartmentsDropDown',
  LeaveTypeDropDown: 'GetLeaveTypeDropDown',
  LeaveProcessDropDown: 'GetLeaveProcessDropDown'
} as const;

@Injectable({ providedIn: 'root' })
export class LookupService extends BaseService {
  getDropdownData(flag: string, others?: string | number | null): Observable<any> {
    let params = new HttpParams().set('flag', flag);
    if (others != null && others !== '') {
      params = params.set('others', String(others));
    }
    return this.get('Home/GetDropdownData', params);
  }
}
