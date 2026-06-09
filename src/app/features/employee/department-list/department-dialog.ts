import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { DepartmentService } from '../../../core/services/department.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LookupService, LookupFlags } from '../../../core/services/lookup.service';

@Component({
  selector: 'app-department-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit' : 'Add' }} Department</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Dep Code</mat-label>
          <input matInput formControlName="depCode" />
          <mat-error>Department code is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Department Name</mat-label>
          <input matInput formControlName="departmentName" />
          <mat-error>Department name is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>HOD</mat-label>
          <mat-select formControlName="hod">
            <mat-option [value]="0">— None —</mat-option>
            @for (e of employees(); track e.value) {
              <mat-option [value]="+e.value!">{{ e.text }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="ref.close()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving">
        {{ saving ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
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
export class DepartmentDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(DepartmentService);
  private readonly notification = inject(NotificationService);
  private readonly lookup = inject(LookupService);
  protected readonly ref = inject(MatDialogRef<DepartmentDialogComponent>);
  protected readonly data = inject<{ department: any }>(MAT_DIALOG_DATA);
  readonly employees = signal<any[]>([]);

  readonly isEdit = !!this.data.department;
  saving = false;

  readonly form = this.fb.group({
    depCode: [this.data.department?.depCode ?? '', Validators.required],
    departmentName: [this.data.department?.departmentName ?? '', Validators.required],
    hod: [Number(this.data.department?.hod ?? 0)]
  });

  ngOnInit(): void {
    this.lookup.getDropdownData(LookupFlags.Employees).subscribe(r => this.employees.set(r.data ?? []));
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const v = this.form.getRawValue();
    const payload = { depCode: v.depCode, departmentName: v.departmentName ?? '', hod: v.hod ?? 0 };
    const obs = this.isEdit
      ? this.service.update(this.data.department.depId, payload)
      : this.service.create(payload);
    obs.subscribe({
      next: () => {
        this.notification.success('Saved', `Department ${this.isEdit ? 'updated' : 'created'}.`);
        this.ref.close(true);
      },
      error: (err) => {
        this.notification.error('Failed', err?.message || 'Could not save department.');
        this.saving = false;
      }
    });
  }
}
