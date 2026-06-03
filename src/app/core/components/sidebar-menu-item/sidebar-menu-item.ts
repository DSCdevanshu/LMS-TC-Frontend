import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NavHistoryService } from '../../services/nav-history.service';


// Maps Font Awesome icon names (sent from backend) → Material icon names
const FA_TO_MAT: Record<string, string> = {
  'fa-home': 'home',
  'fa-tachometer-alt': 'dashboard',
  'fa-user': 'person',
  'fa-address-book': 'contacts',
  'fa-users': 'group',
  'fa-list': 'list',
  'fa-user-plus': 'person_add',
  'fa-tags': 'label',
  'fa-calendar-alt': 'event',
  'fa-plus-circle': 'add_circle',
  'fa-user-clock': 'schedule',
  'fa-users-cog': 'manage_accounts',
  'fa-globe': 'public',
  'fa-balance-scale': 'balance',
  'fa-database': 'storage',
  'fa-building': 'business',
  'fa-id-badge': 'badge',
  'fa-map-marker-alt': 'location_on',
  'fa-calendar-day': 'today',
  'fa-cogs': 'settings',
  'fa-user-shield': 'admin_panel_settings',
  'fa-key': 'vpn_key',
};

@Component({
  selector: 'app-sidebar-menu-item',
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar-menu-item.html',
  styleUrl: './sidebar-menu-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarMenuItemComponent {
  private readonly navHistory = inject(NavHistoryService);
  readonly item = input.required<any>();
  readonly collapsed = input(false);
  readonly depth = input(0);

  readonly expanded = signal(false);
  readonly hasChildren = computed(() => (this.item()?.children?.length ?? 0) > 0);

  toggle(): void {
    this.expanded.update((value) => !value);
  }

  linkFor(route: string): string {
    if (!route) return '/dashboard';
    const normalized = route.trim().replace(/\s+/g, '-');
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }

  onMenuClick(): void {
    this.navHistory.reset();
  }

  iconName(icon?: string | null): string {
    if (!icon?.trim()) return 'circle';
    const key = icon.trim();
    return FA_TO_MAT[key] ?? 'circle';
  }
}
