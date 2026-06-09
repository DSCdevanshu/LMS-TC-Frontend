import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LeaveService } from '../../../core/services/leave.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-leave-types',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatTableModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressBarModule
  ],
  templateUrl: './leave-types.html',
  styleUrl: './leave-types.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeaveTypesComponent implements OnInit {
  private readonly leaveService = inject(LeaveService);
  private readonly notification = inject(NotificationService);

  readonly loading = signal(false);
  readonly displayedColumns = ['leaveTypeName', 'defaultDays', 'isCarryForward'];
  readonly dataSource = new MatTableDataSource<any>([]);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.leaveService.getLeaveTypes().subscribe({
      next: (res: any) => { this.dataSource.data = res?.data ?? []; this.loading.set(false); },
      error: (err) => { this.notification.error('Load Failed', err?.message || 'Could not load leave types.'); this.loading.set(false); }
    });
  }
}
