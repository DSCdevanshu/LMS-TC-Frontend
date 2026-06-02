import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LeaveService } from '../../../core/services/leave.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RemarksDialog } from './remarks-dialog';

@Component({
  selector: 'app-leave-details',
  imports: [
    RouterLink, DatePipe,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
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

  readonly loading = signal(true);
  readonly details = signal<any>(null);
  readonly actions = signal<any[]>([]);
  readonly history = signal<any[]>([]);
  readonly historyColumns = ['processDate', 'status', 'processByName', 'remarks'];
  readonly dayColumns = ['leaveDate', 'dayName', 'dayLeaveType'];

  private leaveId = 0;

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
    const ref = this.dialog.open(RemarksDialog, {
      width: '420px',
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

  edit(): void {
    void this.router.navigate(['/leaves/new'], { queryParams: { editId: this.leaveId } });
  }
}
