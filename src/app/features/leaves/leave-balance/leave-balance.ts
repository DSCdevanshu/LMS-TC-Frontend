import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LeaveService } from '../../../core/services/leave.service';
import { NotificationService } from '../../../core/services/notification.service';


@Component({
  selector: 'app-leave-balance',
  imports: [MatCardModule, MatIconModule, MatProgressBarModule],
  templateUrl: './leave-balance.html',
  styleUrl: './leave-balance.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeaveBalanceComponent implements OnInit {
  private readonly leaveService = inject(LeaveService);
  private readonly notification = inject(NotificationService);

  readonly loading = signal(true);
  readonly balance = signal<any>(null);

  ngOnInit(): void {
    this.leaveService.myBalance().subscribe({
      next: (b) => { this.balance.set(b); this.loading.set(false); },
      error: () => { this.notification.error('Load Failed', 'Could not load balance.'); this.loading.set(false); }
    });
  }
}
