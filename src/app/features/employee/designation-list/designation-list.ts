import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DesignationService } from '../../../core/services/designation.service';
import { NotificationService } from '../../../core/services/notification.service';


@Component({
  selector: 'app-designation-list',
  imports: [
    ReactiveFormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCardModule, MatProgressBarModule
  ],
  templateUrl: './designation-list.html',
  styleUrl: './designation-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DesignationListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(DesignationService);
  private readonly notification = inject(NotificationService);

  readonly loading = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly displayedColumns = ['designationId', 'title', 'actions'];
  readonly dataSource = new MatTableDataSource<any>([]);

  readonly form = this.fb.group({
    title: ['', Validators.required]
  });

  ngOnInit(): void { this.refresh(); }

  refresh(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (res) => { this.dataSource.data = res.data ?? []; this.loading.set(false); },
      error: () => { this.notification.error('Load Failed', 'Could not load designations.'); this.loading.set(false); }
    });
  }

  edit(row: any): void {
    this.editingId.set(row?.designationId ?? null);
    this.form.patchValue({ title: row?.title ?? '' });
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset({ title: '' });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const payload = { title: this.form.value.title ?? '' };
    const id = this.editingId();
    const obs = id ? this.service.update(id, payload) : this.service.create(payload);
    obs.subscribe({
      next: () => { this.notification.success('Saved', 'Designation saved.'); this.cancel(); this.refresh(); },
      error: () => this.notification.error('Save Failed', 'Could not save designation.')
    });
  }

  remove(row: any): void {
    if (!row?.designationId || !confirm(`Delete ${row?.title}?`)) return;
    this.service.remove(row?.designationId).subscribe({
      next: () => { this.notification.success('Deleted', 'Designation removed.'); this.refresh(); },
      error: () => this.notification.error('Delete Failed', 'Could not delete designation.')
    });
  }
}
