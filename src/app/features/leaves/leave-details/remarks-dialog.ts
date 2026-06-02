import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-remarks-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.actionName }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Remarks</mat-label>
        <textarea matInput rows="3" [formControl]="control"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Cancel</button>
      <button mat-flat-button color="primary" (click)="ref.close(control.value || '')">Confirm</button>
    </mat-dialog-actions>
  `,
  styles: [`.w-full{width:100%}`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RemarksDialog {
  protected readonly ref = inject(MatDialogRef<RemarksDialog>);
  protected readonly data = inject<{ actionName: string }>(MAT_DIALOG_DATA);
  protected readonly control = inject(FormBuilder).control('');
}
