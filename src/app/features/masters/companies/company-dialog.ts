import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MasterService } from '../../../core/services/master.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-company-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit' : 'Add' }} Company</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Company Code</mat-label>
          <input matInput formControlName="companyCode" />
          <mat-error>Company code is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Company Name</mat-label>
          <input matInput formControlName="companyName" />
          <mat-error>Company name is required</mat-error>
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
export class CompanyDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MasterService);
  private readonly notification = inject(NotificationService);
  protected readonly ref = inject(MatDialogRef<CompanyDialogComponent>);
  protected readonly data = inject<{ company: any }>(MAT_DIALOG_DATA);

  readonly isEdit = !!this.data.company;
  readonly saving = signal(false);

  readonly form = this.fb.group({
    companyCode: [this.data.company?.companyCode ?? '', Validators.required],
    companyName: [this.data.company?.companyName ?? '', Validators.required]
  });

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const payload = { companyCode: v.companyCode ?? '', companyName: v.companyName ?? '' };
    const obs = this.isEdit
      ? this.service.updateCompany(this.data.company.companyId, payload)
      : this.service.createCompany(payload);
    obs.subscribe({
      next: (res) => {
        this.notification.success('Saved', res?.message || `Company ${this.isEdit ? 'updated' : 'created'}.`);
        this.ref.close(true);
      },
      error: (err) => {
        this.notification.error('Failed', err?.error?.message || 'Could not save company.');
        this.saving.set(false);
      }
    });
  }
}
