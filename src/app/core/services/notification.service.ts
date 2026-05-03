import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(summary: string, detail: string): void {
    this.snackBar.open(`${summary}: ${detail}`, 'Close', {
      duration: 3000,
      panelClass: ['snack-success'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  error(summary: string, detail: string): void {
    this.snackBar.open(`${summary}: ${detail}`, 'Close', {
      duration: 4500,
      panelClass: ['snack-error'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  info(summary: string, detail: string): void {
    this.snackBar.open(`${summary}: ${detail}`, 'Close', {
      duration: 3000,
      panelClass: ['snack-info'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}
