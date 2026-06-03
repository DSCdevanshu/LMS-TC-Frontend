import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DatePipe } from '@angular/common';
import { LeaveService } from '../../../core/services/leave.service';
import { LookupService } from '../../../core/services/lookup.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LookupFlags } from '../../../core/services/lookup.service';
import { DateInputMaskDirective } from '../../../core/directives/date-input-mask.directive';

@Component({
  selector: 'app-leave-list',
  imports: [
    ReactiveFormsModule, RouterLink, DatePipe,
    MatTableModule, MatPaginatorModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatProgressBarModule,
    DateInputMaskDirective
  ],
  templateUrl: './leave-list.html',
  styleUrl: './leave-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeaveListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly leaveService = inject(LeaveService);
  private readonly lookup = inject(LookupService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly leaveTypes = signal<any[]>([]);
  readonly displayedColumns = ['leaveReqID', 'employeeName', 'leaveTypeName', 'startDate', 'endDate', 'totalDays', 'currentStatusName', 'actions'];
  readonly dataSource = new MatTableDataSource<any>([]);

  readonly filterForm = this.fb.group({
    dateFrom: [null as Date | null],
    dateTo: [null as Date | null],
    leaveTypeid: [0],
    processID: [0]
  });

  ngOnInit(): void {
    this.lookup.getDropdownData(LookupFlags.LeaveTypes).subscribe(r => this.leaveTypes.set(r.data ?? []));
    this.search();
  }

  search(): void {
    const v = this.filterForm.value;
    this.loading.set(true);
    this.leaveService.list({
      dateFrom: v.dateFrom ? this.iso(v.dateFrom) : null,
      dateTo: v.dateTo ? this.iso(v.dateTo) : null,
      leaveTypeid: v.leaveTypeid || 0,
      processID: v.processID || 0
    }).subscribe({
      next: (rows) => { this.dataSource.data = rows ?? []; this.loading.set(false); },
      error: () => { this.notification.error('Load Failed', 'Could not load leave list.'); this.loading.set(false); }
    });
  }

  reset(): void {
    this.filterForm.reset({ dateFrom: null, dateTo: null, leaveTypeid: 0, processID: 0 });
    this.search();
  }

  view(row: any): void {
    void this.router.navigate(['/leaves', row?.leaveReqID]);
  }

  private iso(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
}
