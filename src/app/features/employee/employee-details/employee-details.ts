import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { EmployeeService } from '../../../core/services/employee.service';
import { LookupService, LookupFlags } from '../../../core/services/lookup.service';
import { NotificationService } from '../../../core/services/notification.service';


@Component({
  selector: 'app-employee-details',
  imports: [RouterLink, DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatProgressBarModule, MatDividerModule],
  templateUrl: './employee-details.html',
  styleUrl: './employee-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly employeeService = inject(EmployeeService);
  private readonly lookup = inject(LookupService);
  private readonly notification = inject(NotificationService);

  readonly employee = signal<any>(null);
  readonly loading = signal(true);
  private readonly departments = signal<any[]>([]);
  private readonly designations = signal<any[]>([]);
  private readonly managers = signal<any[]>([]);

  readonly departmentName = computed(() => {
    const emp = this.employee();
    const list = this.departments();
    return list.find((d: any) => String(d.value) === String(emp?.departmentId))?.text || '—';
  });

  readonly designationName = computed(() => {
    const emp = this.employee();
    const list = this.designations();
    return list.find((d: any) => String(d.value) === String(emp?.designationId))?.text || '—';
  });

  readonly managerNames = computed(() => {
    const emp = this.employee();
    const list = this.managers();
    const ids: number[] = emp?.reportingManagerIds ?? [];
    if (!ids.length) return '—';
    return ids.map(id => list.find((m: any) => String(m.value) === String(id))?.text || id).join(', ') || '—';
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;

    forkJoin({
      emp: this.employeeService.getById(id),
      depts: this.lookup.getDropdownData(LookupFlags.Departments),
      desigs: this.lookup.getDropdownData(LookupFlags.Designations),
      mgrs: this.lookup.getDropdownData(LookupFlags.Managers)
    }).subscribe({
      next: (res) => {
        this.employee.set(res.emp.data ?? null);
        this.departments.set(res.depts.data ?? []);
        this.designations.set(res.desigs.data ?? []);
        this.managers.set(res.mgrs.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.notification.error('Load Failed', err?.message || 'Unable to load employee.');
        this.loading.set(false);
      }
    });
  }
}
