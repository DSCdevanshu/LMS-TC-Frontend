import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { LeaveService } from '../../../core/services/leave.service';
import { LookupService, LookupFlags } from '../../../core/services/lookup.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DateInputMaskDirective } from '../../../core/directives/date-input-mask.directive';
import { LeaveCodePipe } from '../../../core/pipes/leave-code.pipe';

@Component({
  selector: 'app-create-leave',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatButtonModule, MatIconModule, MatCardModule,
    DateInputMaskDirective, LeaveCodePipe
  ],
  templateUrl: './create-leave.html',
  styleUrl: './create-leave.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateLeaveComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leaveService = inject(LeaveService);
  private readonly lookup = inject(LookupService);
  private readonly notification = inject(NotificationService);

  readonly submitting = signal(false);
  readonly editId = signal<number | null>(null);
  readonly leaveTypes = signal<any[]>([]);
  readonly employees = signal<any[]>([]);
  readonly canCreateForOthers = signal(false);
  readonly balance = signal<any>(null);

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

  readonly form = this.fb.group({
    userId: [null as number | null],
    leaveTypeId: [0, [Validators.required, Validators.min(1)]],
    startDate: [null as Date | null, Validators.required],
    endDate: [null as Date | null, Validators.required],
    empRemarks: ['']
  }, { validators: this.dateRangeValidator });

  readonly dayCount = computed(() => {
    const start = this.form?.value?.startDate;
    const end = this.form?.value?.endDate;
    if (!start || !end) return 0;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  });

  constructor() {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 1; y <= currentYear + 2; y++) this.years.push(y);
  }

  ngOnInit(): void {
    this.lookup.getDropdownData(LookupFlags.LeaveTypes).subscribe(r => this.leaveTypes.set(r.data ?? []));
    this.leaveService.myBalance().subscribe(r => this.balance.set(r.data ?? null));
    this.leaveService.canCreateForOthers().subscribe(r => {
      if (r.data === 1) {
        this.canCreateForOthers.set(true);
        this.lookup.getDropdownData(LookupFlags.Employees).subscribe(e => this.employees.set(e.data ?? []));
      }
    });
    this.loadCalendar();

    // Edit mode: load existing leave data
    const editId = this.route.snapshot.queryParamMap.get('editId');
    if (editId) {
      this.editId.set(+editId);
      this.leaveService.getDetails(+editId).subscribe(res => {
        const h = res?.data?.header;
        if (!h) return;
        this.form.patchValue({
          userId: h.userId ?? null,
          leaveTypeId: h.leaveTypeId ?? 0,
          startDate: h.startDate ? new Date(h.startDate) : null,
          endDate: h.endDate ? new Date(h.endDate) : null,
          empRemarks: h.empRemarks ?? ''
        });
      });
    }
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
    // Empty slots before first day
    for (let i = 0; i < firstDay; i++) days.push({ day: null });
    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${month}-${d}`;
      const event = eventMap.get(key) ?? null;
      const isToday = today.getDate() === d && today.getMonth() + 1 === month && today.getFullYear() === year;
      const isSunday = new Date(year, month - 1, d).getDay() === 0;
      days.push({ day: d, event, isToday, isSunday });
    }
    this.calendarDays.set(days);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.submitting.set(true);
    this.leaveService.submit({
      leaveRequestId: this.editId() || null,
      userId: v.userId || null,
      leaveTypeId: v.leaveTypeId ?? 0,
      startDate: this.iso(v.startDate!),
      endDate: this.iso(v.endDate!),
      empRemarks: v.empRemarks || null
    }).subscribe({
      next: (res) => {
        this.notification.success('Saved', res.message || 'Leave request saved as draft.');
        this.submitting.set(false);
        const leaveId = res.data?.leaveReqId;
        if (leaveId) {
          void this.router.navigate(['/leaves', leaveId]);
        } else {
          this.form.reset({ leaveTypeId: 0, userId: null, empRemarks: '' });
          this.leaveService.myBalance().subscribe(r => this.balance.set(r.data ?? null));
          this.loadCalendar();
        }
      },
      error: () => {
        this.notification.error('Submit Failed', 'Could not submit leave request.');
        this.submitting.set(false);
      }
    });
  }

  private dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    if (!start || !end) return null;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
    if (days > 30) return { maxRange: true };
    return null;
  }

  private iso(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
}
