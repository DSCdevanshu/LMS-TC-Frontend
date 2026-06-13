import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DashboardService } from '../../core/services/dashboard.service';
import { LayoutService } from '../../core/services/layout.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink, MatIconModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly dashboard = inject(DashboardService);
  private readonly layout = inject(LayoutService);
  private readonly notification = inject(NotificationService);

  readonly loading = signal(true);
  readonly profile = signal<any>(null);

  readonly birthdays = signal<any[]>([]);
  readonly anniversaries = signal<any[]>([]);
  readonly holidays = signal<any[]>([]);
  readonly announcements = signal<any[]>([]);
  readonly policies = signal<any[]>([]);

  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  });

  readonly displayName = computed(() => {
    const p = this.profile();
    return p?.fullName || [p?.firstName, p?.lastName].filter(Boolean).join(' ') || 'there';
  });

  readonly today = new Date();

  ngOnInit(): void {
    this.layout.getMyDetails().subscribe(res => this.profile.set(res?.data ?? null));

    forkJoin({
      b: this.dashboard.birthdays(),
      a: this.dashboard.anniversaries(),
      h: this.dashboard.holidays(),
      an: this.dashboard.announcements(),
      p: this.dashboard.policies()
    }).subscribe({
      next: ({ b, a, h, an, p }) => {
        this.birthdays.set(b?.data ?? []);
        this.anniversaries.set(a?.data ?? []);
        this.holidays.set(h?.data ?? []);
        this.announcements.set(an?.data ?? []);
        this.policies.set(p?.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.notification.error('Load Failed', err?.message || 'Could not load dashboard data.');
        this.loading.set(false);
      }
    });
  }

  initials(name: string | null | undefined): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';
    return (first + second).toUpperCase() || '?';
  }

  daysLabel(days: number | string | null | undefined): string {
    const n = Number(days);
    if (!Number.isFinite(n)) return '';
    if (n <= 0) return 'Today';
    if (n === 1) return 'Tomorrow';
    return `in ${n} days`;
  }
}
