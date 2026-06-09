import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-role-name-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Create New Role</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Role Name</mat-label>
        <input matInput [formControl]="nameControl" placeholder="e.g. HR Manager" cdkFocusInitial />
        @if (nameControl.hasError('required') && nameControl.touched) {
          <mat-error>Role name is required</mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="nameControl.invalid">Create Role</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .role-name-dialog .mat-mdc-dialog-content { padding-top: 20px !important; padding-bottom: 8px; min-height: 80px; }
    .role-name-dialog .full-width { width: 100%; }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleNameDialog {
  private readonly dialogRef = inject(MatDialogRef<RoleNameDialog>);
  private readonly fb = inject(FormBuilder);

  readonly nameControl = this.fb.control('', [Validators.required, Validators.minLength(2)]);

  submit(): void {
    if (this.nameControl.valid) {
      this.dialogRef.close(this.nameControl.value!.trim());
    }
  }
}
