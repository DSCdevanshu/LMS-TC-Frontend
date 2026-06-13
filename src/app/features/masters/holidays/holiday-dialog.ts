import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MasterService } from '../../../core/services/master.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-holiday-dialog',
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatCheckboxModule, MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit' : 'Add' }} Holiday</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Holiday Name</mat-label>
          <input matInput formControlName="holidayName" />
          <mat-error>Holiday name is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Holiday Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="holidayDate" />
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          <mat-error>Holiday date is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Company</mat-label>
          <mat-select formControlName="companyId">
            @for (c of companies(); track c.companyId) {
              <mat-option [value]="c.companyId">{{ c.companyName }}</mat-option>
            }
          </mat-select>
          <mat-error>Company is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Location</mat-label>
          <mat-select formControlName="locationId">
            @for (l of locations(); track l.locationId) {
              <mat-option [value]="l.locationId">{{ l.locationName }}</mat-option>
            }
          </mat-select>
          <mat-error>Location is required</mat-error>
        </mat-form-field>
        <mat-checkbox formControlName="isRestricted">Restricted Holiday</mat-checkbox>
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
export class HolidayDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MasterService);
  private readonly notification = inject(NotificationService);
  protected readonly ref = inject(MatDialogRef<HolidayDialogComponent>);
  protected readonly data = inject<{ holiday: any }>(MAT_DIALOG_DATA);

  readonly isEdit = !!this.data.holiday;
  readonly saving = signal(false);
  readonly companies = signal<any[]>([]);
  readonly locations = signal<any[]>([]);

  readonly form = this.fb.group({
    holidayName: [this.data.holiday?.holidayName ?? '', Validators.required],
    holidayDate: [this.data.holiday?.holidayDate ? new Date(this.data.holiday.holidayDate) : null, Validators.required],
    companyId: [this.data.holiday?.companyId ?? '', Validators.required],
    locationId: [this.data.holiday?.locationId ?? '', Validators.required],
    isRestricted: [this.data.holiday?.isRestricted ?? false]
  });

  ngOnInit(): void {
    this.service.getCompanies().subscribe({
      next: (res) => this.companies.set(res.data ?? [])
    });
    this.service.getLocations().subscribe({
      next: (res) => this.locations.set(res.data ?? [])
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const payload = {
      holidayName: v.holidayName ?? '',
      holidayDate: v.holidayDate ? new Date(v.holidayDate).toISOString() : '',
      companyId: v.companyId ?? '',
      locationId: v.locationId ?? '',
      isRestricted: v.isRestricted ?? false
    };
    const obs = this.isEdit
      ? this.service.updateHoliday(this.data.holiday.holidayId, payload)
      : this.service.createHoliday(payload);
    obs.subscribe({
      next: (res) => {
        this.notification.success('Saved', res?.message || `Holiday ${this.isEdit ? 'updated' : 'created'}.`);
        this.ref.close(true);
      },
      error: (err) => {
        this.notification.error('Failed', err?.error?.message || 'Could not save holiday.');
        this.saving.set(false);
      }
    });
  }
}
