import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MenuItem } from '../../../data/models/menu-item.model';

// Maps PrimeNG pi icon names (sent from backend) → Material icon names
const PI_TO_MAT: Record<string, string> = {
  'pi-home': 'home',
  'pi-users': 'group',
  'pi-user': 'person',
  'pi-cog': 'settings',
  'pi-chart-bar': 'bar_chart',
  'pi-chart-pie': 'pie_chart',
  'pi-chart-line': 'show_chart',
  'pi-file': 'description',
  'pi-folder': 'folder',
  'pi-calendar': 'calendar_today',
  'pi-book': 'menu_book',
  'pi-briefcase': 'work',
  'pi-desktop': 'computer',
  'pi-globe': 'public',
  'pi-list': 'list',
  'pi-search': 'search',
  'pi-star': 'star',
  'pi-trash': 'delete',
  'pi-pencil': 'edit',
  'pi-plus': 'add',
  'pi-check': 'check',
  'pi-times': 'close',
  'pi-circle': 'circle',
  'pi-bell': 'notifications',
  'pi-dollar': 'attach_money',
  'pi-money-bill': 'payments',
  'pi-id-card': 'badge',
  'pi-building': 'business',
  'pi-sitemap': 'account_tree',
  'pi-th-large': 'grid_view',
  'pi-table': 'table_chart',
  'pi-inbox': 'inbox',
  'pi-send': 'send',
  'pi-lock': 'lock',
  'pi-shield': 'security',
};

@Component({
  selector: 'app-sidebar-menu-item',
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar-menu-item.html',
  styleUrl: './sidebar-menu-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarMenuItemComponent {
  readonly item = input.required<MenuItem>();
  readonly collapsed = input(false);
  readonly depth = input(0);

  readonly expanded = signal(false);
  readonly hasChildren = computed(() => this.item().children.length > 0);

  toggle(): void {
    this.expanded.update((value) => !value);
  }

  linkFor(route: string): string {
    if (!route) return '/dashboard';
    const normalized = route.trim().replace(/\s+/g, '-');
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }

  iconName(icon?: string | null): string {
    if (!icon?.trim()) return 'circle';
    // Strip 'pi ' prefix: 'pi pi-home' → 'pi-home', or use as-is if already 'pi-home'
    const key = icon.trim().replace(/^pi\s+/, '');
    return PI_TO_MAT[key] ?? 'circle';
  }
}
