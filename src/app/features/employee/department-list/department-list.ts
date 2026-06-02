import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { DepartmentService } from '../../../core/services/department.service';
import { LookupService } from '../../../core/services/lookup.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LookupFlags } from '../../../core/services/lookup.service';

@Component({
  selector: 'app-department-list',
  imports: [
    ReactiveFormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCardModule, MatProgressBarModule, MatSelectModule
  ],
  templateUrl: './department-list.html',
  styleUrl: './department-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepartmentListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(DepartmentService);
  private readonly lookup = inject(LookupService);
  private readonly notification = inject(NotificationService);

  readonly loading = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly displayedColumns = ['depCode', 'departmentName', 'hod', 'actions'];
  readonly dataSource = new MatTableDataSource<any>([]);
  readonly employees = signal<any[]>([]);

  readonly form = this.fb.group({
    depCode: [''],
    departmentName: ['', Validators.required],
    hod: [0, Validators.required]
  });

  ngOnInit(): void {
    this.refresh();
    this.lookup.getDropdownData(LookupFlags.Employees).subscribe(r => this.employees.set(r.data ?? []));
  }

  refresh(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (res) => { this.dataSource.data = res.data ?? []; this.loading.set(false); },
      error: () => { this.notification.error('Load Failed', 'Could not load departments.'); this.loading.set(false); }
    });
  }

  edit(row: any): void {
    this.editingId.set(row?.depId ?? null);
    this.form.patchValue({
      depCode: row?.depCode ?? '',
      departmentName: row?.departmentName ?? '',
      hod: Number(row?.hod ?? 0)
    });
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset({ depCode: '', departmentName: '', hod: 0 });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const payload = {
      depCode: v.depCode || null,
      departmentName: v.departmentName ?? '',
      hod: v.hod ?? 0
    };
    const id = this.editingId();
    const obs = id ? this.service.update(id, payload) : this.service.create(payload);
    obs.subscribe({
      next: () => {
        this.notification.success('Saved', 'Department saved.');
        this.cancel();
        this.refresh();
      },
      error: () => this.notification.error('Save Failed', 'Could not save department.')
    });
  }

  remove(row: any): void {
    if (!row?.depId || !confirm(`Delete ${row?.departmentName}?`)) return;
    this.service.remove(row?.depId).subscribe({
      next: () => { this.notification.success('Deleted', 'Department removed.'); this.refresh(); },
      error: () => this.notification.error('Delete Failed', 'Could not delete department.')
    });
  }
}
