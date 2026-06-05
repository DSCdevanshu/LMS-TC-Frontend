import { ChangeDetectionStrategy, Component, input, output, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

export interface RowAction {
  key: string;
  label: string;
  icon: string;
  color?: string;
}

@Component({
  selector: 'app-row-actions',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="menu"><mat-icon>more_vert</mat-icon></button>
    <mat-menu #menu="matMenu">
      @for (a of actions(); track a.key) {
        <button mat-menu-item (click)="actionClick.emit(a.key)" [class]="'action-' + (a.color ?? '')">
          <mat-icon>{{ a.icon }}</mat-icon>
          <span>{{ a.label }}</span>
        </button>
      }
    </mat-menu>
  `,
  styleUrl: './row-actions.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RowActionsComponent {
  readonly actions = input.required<RowAction[]>();
  readonly actionClick = output<string>();
}
