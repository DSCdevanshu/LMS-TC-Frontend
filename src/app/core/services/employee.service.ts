import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../data/models/api-response.model';
import {
  CreateEmployeePayload,
  Department,
  Designation,
  EmployeeFilterRequest,
  EmployeeListItem,
  GenericDropdownDto
} from '../../data/models/employee.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService extends BaseService {
  /**
   * Generic method to fetch dropdown data from unified API endpoint
   * @param flag - The dropdown type flag (e.g., 'GetDepartmentDropdown', 'GetDesignationDropdown')
   * @returns Observable of dropdown items as GenericDropdownDto
   */
  getDropdownData(flag: string): Observable<ApiResponse<GenericDropdownDto[]>> {
    const params = new HttpParams().set('flag', flag);
    return this.get<GenericDropdownDto[]>('Home/GetDropdownData', params);
  }

  getDepartments(): Observable<ApiResponse<Department[]>> {
    return this.get<Department[]>('Departments');
  }

  getDesignations(): Observable<ApiResponse<Designation[]>> {
    return this.get<Designation[]>('Designations');
  }

  getEmployees(filter: EmployeeFilterRequest): Observable<ApiResponse<EmployeeListItem[]>> {
    return this.post<EmployeeListItem[]>('Employees/GetEmployeeList', filter);
  }

  createEmployee(payload: CreateEmployeePayload): Observable<ApiResponse<number>> {
    const formData = new FormData();

    formData.append('Username', payload.username);
    formData.append('Password', payload.password);
    formData.append('EmpCode', payload.empCode);
    formData.append('FirstName', payload.firstName);
    formData.append('LastName', payload.lastName);
    formData.append('DateOfBirth', payload.dateOfBirth);
    formData.append('Gender', payload.gender);
    formData.append('Email', payload.email);
    formData.append('HireDate', payload.hireDate);
    formData.append('DesignationId', String(payload.designationId));
    formData.append('DepartmentId', String(payload.departmentId));

    if (payload.middleName) {
      formData.append('MiddleName', payload.middleName);
    }
    if (payload.fathersName) {
      formData.append('FathersName', payload.fathersName);
    }
    if (payload.mothersName) {
      formData.append('MothersName', payload.mothersName);
    }
    if (payload.address) {
      formData.append('Address', payload.address);
    }
    if (payload.phoneNumber) {
      formData.append('PhoneNumber', payload.phoneNumber);
    }
    if (payload.pan) {
      formData.append('PAN', payload.pan);
    }
    if (payload.aadhaarCard) {
      formData.append('AadhaarCard', payload.aadhaarCard);
    }
    if (payload.bankAccountNumber) {
      formData.append('BankAccountNumber', payload.bankAccountNumber);
    }
    if (payload.photo) {
      formData.append('Photo', payload.photo);
    }

    (payload.reportingManagerIds ?? []).forEach((managerId) => {
      formData.append('ReportingManagerIds', String(managerId));
    });

    return this.http.post<ApiResponse<number>>(`${this.baseUrl}/Employees/CreateEmployee`, formData);
  }
}
