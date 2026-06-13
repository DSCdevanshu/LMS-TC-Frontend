import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LeaveService } from '../../../core/services/leave.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NavHistoryService } from '../../../core/services/nav-history.service';
import { LeaveCodePipe } from '../../../core/pipes/leave-code.pipe';
import { RemarksDialog } from './remarks-dialog';

@Component({
  selector: 'app-leave-details',
  imports: [
    DatePipe, LeaveCodePipe,
    MatButtonModule, MatIconModule,
    MatTableModule, MatProgressBarModule, MatDialogModule,
    MatCardModule, MatFormFieldModule, MatSelectModule
  ],
  templateUrl: './leave-details.html',
  styleUrl: './leave-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeaveDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leaveService = inject(LeaveService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly navHistory = inject(NavHistoryService);

  readonly loading = signal(true);
  readonly details = signal<any>(null);
  readonly actions = signal<any[]>([]);
  readonly history = signal<any[]>([]);
  readonly latestStep = computed(() => {
    const h = this.history();
    return h.length ? h[h.length - 1] : null;
  });
  readonly dayColumns = ['leaveDate', 'dayName', 'dayLeaveType'];

  // Balance
  readonly balance = signal<any[]>([]);

  // Calendar state
  readonly calendarMonth = signal(new Date().getMonth() + 1);
  readonly calendarYear = signal(new Date().getFullYear());
  readonly calendarDays = signal<any[]>([]);
  readonly calendarEvents = signal<any[]>([]);

  readonly months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];
  readonly years: number[] = [];
  readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  private leaveId = 0;

  constructor() {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 1; y <= currentYear + 2; y++) this.years.push(y);
  }

  goBack(): void {
    this.navHistory.goBack();
  }

  ngOnInit(): void {
    this.leaveId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.leaveId) return;
    this.refresh();
    this.leaveService.myBalance().subscribe(r => this.balance.set(r.data ?? []));
    this.loadCalendar();
  }

  refresh(): void {
    this.loading.set(true);
    forkJoin({
      d: this.leaveService.getDetails(this.leaveId),
      a: this.leaveService.getAvailableActions(this.leaveId),
      h: this.leaveService.getHistory(this.leaveId)
    }).subscribe({
      next: ({ d, a, h }) => {
        this.details.set(d.data ?? null);
        this.actions.set(a.data ?? []);
        this.history.set(h.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.notification.error('Load Failed', err?.message || 'Could not load leave details.');
        this.loading.set(false);
      }
    });
  }

  onCalendarChange(): void {
    this.loadCalendar();
  }

  resetCalendar(): void {
    const now = new Date();
    this.calendarMonth.set(now.getMonth() + 1);
    this.calendarYear.set(now.getFullYear());
    this.loadCalendar();
  }

  private loadCalendar(): void {
    const month = this.calendarMonth();
    const year = this.calendarYear();
    this.leaveService.getCalendar(month, year).subscribe(r => {
      this.calendarEvents.set(r.data ?? []);
      this.buildCalendarDays(month, year, r.data ?? []);
    });
  }

  private buildCalendarDays(month: number, year: number, events: any[]): void {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();

    const eventMap = new Map<string, any>();
    for (const ev of events) {
      if (!ev.date) continue;
      const d = new Date(ev.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const status = (ev.status ?? '').toLowerCase();
      const type = (ev.type ?? '').toLowerCase();
      let group = 'pending';
      if (status === 'fixed') group = 'holiday';
      else if (status.includes('approved')) group = 'approved';
      else if (status.includes('hold')) group = 'onhold';
      else if (status === 'draft' || status === 'requested') group = 'pending';
      eventMap.set(key, { ...ev, status, type, group });
    }

    const days: any[] = [];
    for (let i = 0; i < firstDay; i++) days.push({ day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${month}-${d}`;
      const event = eventMap.get(key) ?? null;
      const isToday = today.getDate() === d && today.getMonth() + 1 === month && today.getFullYear() === year;
      const isSunday = new Date(year, month - 1, d).getDay() === 0;
      days.push({ day: d, event, isToday, isSunday });
    }
    this.calendarDays.set(days);
  }

  takeAction(action: any): void {
    // Edit → navigate to apply page with editId
    if (+action?.processId === 1) {
      void this.router.navigate(['/leaves/apply'], { queryParams: { editId: this.leaveId } });
      return;
    }

    const ref = this.dialog.open(RemarksDialog, {
      width: '480px',
      data: { actionName: action?.buttonName }
    });
    ref.afterClosed().subscribe((remarks) => {
      if (remarks === undefined) return;
      this.leaveService.changeStatus({
        leaveReqId: this.leaveId,
        processId: action?.processId,
        remarks
      }).subscribe({
        next: (res: any) => {
          this.notification.success('Success', res?.message || `Leave ${action?.buttonName?.toLowerCase()}.`);
          this.refresh();
          this.leaveService.myBalance().subscribe(r => this.balance.set(r.data ?? []));
          this.loadCalendar();
        },
        error: (err) => this.notification.error('Action Failed', err?.message || 'Could not update leave status.')
      });
    });
  }

  statusGroup(status: string): string {
    const s = (status ?? '').toLowerCase();
    if (s.includes('approved')) return 'approved';
    if (s.includes('hold')) return 'onhold';
    if (s.includes('rejected')) return 'rejected';
    return 'pending';
  }
}
