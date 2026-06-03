import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NavHistoryService } from '../../services/nav-history.service';

@Component({
  selector: 'app-nav-breadcrumb',
  imports: [MatIconModule],
  template: `
    @if (crumbs().length >= 1) {
      <nav class="breadcrumb-bar">
        @for (c of crumbs(); track c.url; let last = $last) {
          @if (last) {
            <span class="crumb current">{{ c.title }}</span>
          } @else {
            <button class="crumb link" (click)="go(c)">{{ c.title }}</button>
            <mat-icon class="sep">chevron_right</mat-icon>
          }
        }
      </nav>
    }
  `,
  styles: `
    .breadcrumb-bar {
      display: flex;
      align-items: center;
      gap: 2px;
      flex-wrap: wrap;
      padding: 0;
      margin-top: 6px;
    }
    .crumb {
      font-size: 13px;
      line-height: 1;
    }
    .crumb.link {
      background: none;
      border: none;
      color: #3b82f6;
      cursor: pointer;
      padding: 0;
      font: inherit;
      font-size: 13px;
      &:hover { text-decoration: underline; }
    }
    .crumb.current {
      color: #64748b;
    }
    .sep {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #94a3b8;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavBreadcrumbComponent {
  private readonly navHistory = inject(NavHistoryService);
  readonly crumbs = computed(() => this.navHistory.stack());

  go(entry: any): void {
    this.navHistory.navigateTo(entry);
  }
}
