import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NavHistoryService } from '../../services/nav-history.service';

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
    return icon?.trim() || 'circle';
  }
}
