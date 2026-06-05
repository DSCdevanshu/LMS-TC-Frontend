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
  getDropdownData(flag: string): Observable<any> {
    const params = new HttpParams().set('flag', flag);
    return this.get('Home/GetDropdownData', params);
  }
}
