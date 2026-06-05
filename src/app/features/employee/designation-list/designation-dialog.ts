import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { DesignationService } from '../../../core/services/designation.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-designation-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit' : 'Add' }} Designation</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" />
          <mat-error>Title is required</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="ref.close()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving()">
        {{ saving() ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; }
    .dialog-form { display: flex; flex-direction: column; gap: 16px; width: 100%; padding: 16px 0 8px; }
    .full { width: 100%; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DesignationDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(DesignationService);
  private readonly notification = inject(NotificationService);
  protected readonly ref = inject(MatDialogRef<DesignationDialogComponent>);
  protected readonly data = inject<{ designation: any }>(MAT_DIALOG_DATA);

  readonly isEdit = !!this.data.designation;
  readonly saving = signal(false);

  readonly form = this.fb.group({
    title: [this.data.designation?.title ?? '', Validators.required]
  });

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const payload = { title: this.form.getRawValue().title ?? '' };
    const obs = this.isEdit
      ? this.service.update(this.data.designation.designationId, payload)
      : this.service.create(payload);
    obs.subscribe({
      next: () => {
        this.notification.success('Saved', `Designation ${this.isEdit ? 'updated' : 'created'}.`);
        this.ref.close(true);
      },
      error: () => {
        this.notification.error('Failed', 'Could not save designation.');
        this.saving.set(false);
      }
    });
  }
}
