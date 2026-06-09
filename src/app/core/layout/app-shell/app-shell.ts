import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { LayoutService } from '../../services/layout.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { NavHistoryService } from '../../services/nav-history.service';
import { SidebarMenuItemComponent } from '../../components/sidebar-menu-item/sidebar-menu-item';
import { NavBreadcrumbComponent } from '../../components/nav-breadcrumb/nav-breadcrumb';

@Component({
  selector: 'app-shell',
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterOutlet,
    SidebarMenuItemComponent,
    NavBreadcrumbComponent
  ],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppShellComponent implements OnInit {
  private readonly layoutService = inject(LayoutService);
  private readonly notification = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly navHistory = inject(NavHistoryService);
  private readonly router = inject(Router);

  private readonly activatedRoute = inject(ActivatedRoute);

  readonly collapsed = signal(false);
  readonly loading = signal(true);
  readonly menu = signal<any[]>([]);
  readonly profile = signal<any>(null);
  readonly title = signal<string>('Dashboard');

  readonly displayName = computed(() => {
    const detail = this.profile();
    return detail?.fullName || [detail?.firstName, detail?.lastName].filter(Boolean).join(' ') || 'User';
  });

  ngOnInit(): void {
    this.navHistory.init();
    this.loadShellData();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      let r = this.activatedRoute;
      while (r.firstChild) r = r.firstChild;
      const t = r.snapshot.data['title'] as string | undefined;
      if (t) this.title.set(t);
    });
  }

  toggleSidebar(): void {
    this.collapsed.update((value) => !value);
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  private loadShellData(): void {
    this.loading.set(true);

    this.layoutService.getMyMenu().subscribe({
      next: (res) => this.menu.set(res.data ?? []),
      error: (err) => {
        this.notification.error('Menu Load Failed', err?.message || 'Unable to load your menu.');
        this.menu.set([]);
      }
    });

    this.layoutService.getMyDetails().subscribe({
      next: (res) => this.profile.set(res.data ?? null),
      error: (err) => {
        this.notification.error('Profile Load Failed', err?.message || 'Unable to load your profile.');
        this.profile.set(null);
      },
      complete: () => this.loading.set(false)
    });
  }
}
