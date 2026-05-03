import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MenuItem } from '../../../data/models/menu-item.model';
import { UserProfile } from '../../../data/models/user-profile.model';
import { LayoutService } from '../../services/layout.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { SidebarMenuItemComponent } from '../../components/sidebar-menu-item/sidebar-menu-item';

@Component({
  selector: 'app-shell',
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterOutlet,
    SidebarMenuItemComponent
  ],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppShellComponent implements OnInit {
  private readonly layoutService = inject(LayoutService);
  private readonly notification = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly collapsed = signal(false);
  readonly loading = signal(true);
  readonly menu = signal<MenuItem[]>([]);
  readonly profile = signal<UserProfile | null>(null);

  readonly displayName = computed(() => {
    const detail = this.profile();
    return detail?.fullName || [detail?.firstName, detail?.lastName].filter(Boolean).join(' ') || 'User';
  });

  ngOnInit(): void {
    this.loadShellData();
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
      error: () => {
        this.notification.error('Menu Load Failed', 'Unable to load your menu.');
        this.menu.set([]);
      }
    });

    this.layoutService.getMyDetails().subscribe({
      next: (res) => this.profile.set(res.data ?? null),
      error: () => {
        this.notification.error('Profile Load Failed', 'Unable to load your profile.');
        this.profile.set(null);
      },
      complete: () => this.loading.set(false)
    });
  }
}
