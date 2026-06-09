import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { LayoutService } from '../../../core/services/layout.service';
import { NotificationService } from '../../../core/services/notification.service';


@Component({
  selector: 'app-my-profile',
  imports: [DatePipe, MatCardModule, MatProgressBarModule, MatIconModule, MatDividerModule, MatChipsModule],
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyProfileComponent implements OnInit {
  private readonly layoutService = inject(LayoutService);
  private readonly notification = inject(NotificationService);

  readonly loading = signal(true);
  readonly profile = signal<any>(null);

  ngOnInit(): void {
    this.layoutService.getMyDetails().subscribe({
      next: (res) => { this.profile.set(res.data ?? null); this.loading.set(false); },
      error: (err) => { this.notification.error('Load Failed', err?.message || 'Could not load profile.'); this.loading.set(false); }
    });
  }
}
