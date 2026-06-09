import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MasterService } from '../../../core/services/master.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-location-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit' : 'Add' }} Location</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Location Name</mat-label>
          <input matInput formControlName="locationName" />
          <mat-error>Location name is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>State</mat-label>
          <input matInput formControlName="state" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Country</mat-label>
          <input matInput formControlName="country" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Coordinates</mat-label>
          <input matInput formControlName="coordinates" placeholder="e.g. 28.6139,77.2090" />
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
export class LocationDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MasterService);
  private readonly notification = inject(NotificationService);
  protected readonly ref = inject(MatDialogRef<LocationDialogComponent>);
  protected readonly data = inject<{ location: any }>(MAT_DIALOG_DATA);

  readonly isEdit = !!this.data.location;
  readonly saving = signal(false);

  readonly form = this.fb.group({
    locationName: [this.data.location?.locationName ?? '', Validators.required],
    state: [this.data.location?.state ?? ''],
    country: [this.data.location?.country ?? ''],
    coordinates: [this.data.location?.coordinates ?? '']
  });

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const payload = {
      locationName: v.locationName ?? '',
      state: v.state ?? '',
      country: v.country ?? '',
      coordinates: v.coordinates ?? ''
    };
    const obs = this.isEdit
      ? this.service.updateLocation(this.data.location.locationId, payload)
      : this.service.createLocation(payload);
    obs.subscribe({
      next: (res) => {
        this.notification.success('Saved', res?.message || `Location ${this.isEdit ? 'updated' : 'created'}.`);
        this.ref.close(true);
      },
      error: (err) => {
        this.notification.error('Failed', err?.error?.message || 'Could not save location.');
        this.saving.set(false);
      }
    });
  }
}
