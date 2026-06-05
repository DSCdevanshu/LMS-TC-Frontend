import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  color?: 'primary' | 'warn';
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="confirm-icon" [class]="data.color ?? 'warn'">
        <mat-icon>{{ (data.color ?? 'warn') === 'warn' ? 'warning' : 'help_outline' }}</mat-icon>
      </div>
      <h2 mat-dialog-title>{{ data.title ?? 'Confirm' }}</h2>
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions>
        <button mat-stroked-button (click)="ref.close(false)">{{ data.cancelText ?? 'Cancel' }}</button>
        <button mat-flat-button [color]="data.color ?? 'warn'" (click)="ref.close(true)">
          {{ data.confirmText ?? 'Delete' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog { text-align: center; padding: 0.8rem; }
    .confirm-icon { margin: 8px auto 0; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .confirm-icon.warn { background: #fef2f2; color: #ef4444; }
    .confirm-icon.primary { background: #eff6ff; color: #3b82f6; }
    .confirm-icon mat-icon { font-size: 28px; width: 28px; height: 28px; }
    h2[mat-dialog-title] { margin-top: 12px; font-size: 18px; }
    p { color: #6b7280; margin: 0; font-size: 14px; }
    mat-dialog-actions { justify-content: center; padding: 16px 0 8px; gap: 8px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialogComponent {
  protected readonly ref = inject(MatDialogRef<ConfirmDialogComponent>);
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
