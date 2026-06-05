import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
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
    MatTableModule, MatProgressBarModule, MatDialogModule
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
  readonly activeStep = signal(-1);
  readonly dayColumns = ['leaveDate', 'dayName', 'dayLeaveType'];

  private leaveId = 0;

  goBack(): void {
    this.navHistory.goBack();
  }

  ngOnInit(): void {
    this.leaveId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.leaveId) return;
    this.refresh();
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
      error: () => {
        this.notification.error('Load Failed', 'Could not load leave details.');
        this.loading.set(false);
      }
    });
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
        },
        error: () => this.notification.error('Action Failed', 'Could not update leave status.')
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
