import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DatePipe } from '@angular/common';
import { ViewChild, AfterViewInit } from '@angular/core';
import { LeaveService } from '../../../core/services/leave.service';
import { LookupService, LookupFlags } from '../../../core/services/lookup.service';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutService } from '../../../core/services/layout.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RowActionsComponent } from '../../../shared/components/row-actions/row-actions';
import { DateInputMaskDirective } from '../../../core/directives/date-input-mask.directive';
import { LeaveCodePipe } from '../../../core/pipes/leave-code.pipe';

@Component({
  selector: 'app-leave-list',
  imports: [
    ReactiveFormsModule, RouterLink, DatePipe,
    MatTableModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatButtonModule, MatIconModule, MatProgressBarModule,
    RowActionsComponent, DateInputMaskDirective, LeaveCodePipe
  ],
  templateUrl: './leave-list.html',
  styleUrl: './leave-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeaveListComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leaveService = inject(LeaveService);
  private readonly lookup = inject(LookupService);
  private readonly auth = inject(AuthService);
  private readonly layout = inject(LayoutService);
  private readonly notification = inject(NotificationService);

  @ViewChild(MatSort) sort!: MatSort;

  readonly loading = signal(false);
  readonly leaveView = signal<string>('my');
  readonly leaveTypes = signal<any[]>([]);
  readonly allEmployees = signal<any[]>([]);
  readonly selectedDepId = signal<number | null>(null);
  readonly departments = signal<any[]>([]);
  readonly leaveProcesses = signal<any[]>([]);
  readonly dataSource = new MatTableDataSource<any>([]);

  readonly filteredEmployees = computed(() => {
    const depId = this.selectedDepId();
    const all = this.allEmployees();
    if (!depId) return all;
    return all.filter(e => +e.extraData1 === depId);
  });

  readonly rowActions = [
    { key: 'view', label: 'View Details', icon: 'visibility', color: '#2563eb' }
  ];

  get isMyLeaves(): boolean { return this.leaveView() === 'my'; }

  get displayedColumns(): string[] {
    return this.isMyLeaves
      ? ['leaveReqID', 'leaveTypeName', 'startDate', 'endDate', 'totalDays', 'currentStatusName', 'requestDate', 'actions']
      : ['leaveReqID', 'employeeName', 'departmentName', 'leaveTypeName', 'startDate', 'endDate', 'totalDays', 'currentStatusName', 'actions'];
  }

  readonly filterForm = this.fb.group({
    dateFrom: [this.addDays(new Date(), -15) as Date | null],
    dateTo: [this.addDays(new Date(), 15) as Date | null],
    leaveTypeid: [null as number | null],
    leaveUserId: [null as number | null],
    depId: [null as number | null],
    processID: [null as number | null]
  });

  ngOnInit(): void {
    const view = this.route.snapshot.data['leaveView'] ?? 'my';
    this.leaveView.set(view);

    if (this.isMyLeaves) {
      this.lookup.getDropdownData(LookupFlags.LeaveTypes).subscribe(r => this.leaveTypes.set(r.data ?? []));
      this.lookup.getDropdownData(LookupFlags.LeaveProcess).subscribe(r => this.leaveProcesses.set(r.data ?? []));
    } else {
      this.lookup.getDropdownData(LookupFlags.LeaveTypeDropDown).subscribe(r => this.leaveTypes.set(r.data ?? []));
      this.lookup.getDropdownData(LookupFlags.LeaveProcessDropDown).subscribe(r => this.leaveProcesses.set(r.data ?? []));
      this.lookup.getDropdownData(LookupFlags.AuthorizedEmployees).subscribe(r => this.allEmployees.set(r.data ?? []));
      this.lookup.getDropdownData(LookupFlags.AuthorizedDepartments).subscribe(r => this.departments.set(r.data ?? []));

      // Default Department & Employee to logged-in user
      this.layout.getMyDetails().subscribe(res => {
        const me = res?.data;
        if (!me) { this.search(); return; }
        const depId = me.departmentId ?? me.departmentID ?? me.depId ?? null;
        const userId = me.userId ?? me.userID ?? this.auth.getUserId();
        const depIdNum = depId != null ? +depId : null;
        this.selectedDepId.set(depIdNum);
        this.filterForm.patchValue({
          depId: depIdNum,
          leaveUserId: userId != null ? +userId : null
        });
        this.search();
      });
      return;
    }

    this.search();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  onDepartmentChange(depId: number | null): void {
    this.selectedDepId.set(depId);
    // Reset employee if not in filtered list
    const currentEmp = this.filterForm.value.leaveUserId;
    if (currentEmp && depId) {
      const exists = this.filteredEmployees().some(e => +e.value === currentEmp);
      if (!exists) this.filterForm.patchValue({ leaveUserId: null });
    }
  }

  search(): void {
    const v = this.filterForm.value;
    this.loading.set(true);

    const payload: any = {
      dateFrom: v.dateFrom ? this.iso(v.dateFrom) : null,
      dateTo: v.dateTo ? this.iso(v.dateTo) : null,
      leaveTypeid: v.leaveTypeid || null,
      processID: v.processID || null,
      depId: v.depId || null
    };

    if (this.isMyLeaves) {
      payload.leaveUserId = this.auth.getUserId();
    } else {
      payload.leaveUserId = v.leaveUserId || null;
    }

    this.leaveService.list(payload).subscribe({
      next: (res) => {
        this.dataSource.data = res?.data ?? [];
        this.loading.set(false);
      },
      error: (err) => {
        this.notification.error('Load Failed', err?.message || 'Could not load leave list.');
        this.loading.set(false);
      }
    });
  }

  reset(): void {
    this.filterForm.reset({
      dateFrom: this.addDays(new Date(), -15),
      dateTo: this.addDays(new Date(), 15),
      leaveTypeid: null,
      leaveUserId: null,
      depId: null,
      processID: null
    });
    this.search();
  }

  onAction(key: string, row: any): void {
    if (key === 'view') {
      void this.router.navigate(['/leaves', row.leaveReqID]);
    }
  }

  statusGroup(status: string): string {
    const s = (status ?? '').toLowerCase();
    if (s.includes('approved')) return 'approved';
    if (s.includes('hold')) return 'onhold';
    if (s.includes('rejected') || s.includes('cancel')) return 'rejected';
    if (s.includes('draft')) return 'draft';
    return 'pending';
  }

  private iso(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }
}
