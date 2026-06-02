import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';

@Injectable({ providedIn: 'root' })
export class LeaveService extends BaseService {
  myBalance(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/LeaveRequest/my-balance`);
  }

  list(params: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/LeaveRequest/getLeaveUserList`, params ?? {});
  }

  getDetails(id: number): Observable<any> {
    return this.get(`LeaveRequest/getLeaveRequestDetails/${id}`);
  }

  getHistory(id: number): Observable<any> {
    return this.get(`LeaveRequest/getLeaveHistory/${id}`);
  }

  getAvailableActions(id: number): Observable<any> {
    return this.get(`LeaveRequest/getAvailableActions/${id}`);
  }

  submit(payload: any): Observable<any> {
    return this.post('LeaveRequest/postLeaveReqEntryV2', payload);
  }

  changeStatus(payload: any): Observable<any> {
    return this.post('LeaveRequest/updateLeaveStatus', payload);
  }

  getLeaveTypes(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/LeaveRequest/getLeaveType`);
  }

  getCalendar(month: number, year: number): Observable<any> {
    const params = new HttpParams().set('month', month).set('year', year);
    return this.http.get<any>(`${this.baseUrl}/LeaveRequest/getUserCalendarData`, { params });
  }
}
