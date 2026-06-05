import { ChangeDetectionStrategy, Component, OnInit, AfterViewInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DepartmentService } from '../../../core/services/department.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DepartmentDialogComponent } from './department-dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { RowActionsComponent, RowAction } from '../../../shared/components/row-actions/row-actions';

@Component({
  selector: 'app-department-list',
  imports: [
    FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressBarModule, MatSortModule,
    MatDialogModule, RowActionsComponent
  ],
  templateUrl: './department-list.html',
  styleUrl: './department-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepartmentListComponent implements OnInit, AfterViewInit {
  private readonly service = inject(DepartmentService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly displayedColumns = ['depCode', 'departmentName', 'hodName', 'totalEmployees', 'actions'];
  readonly dataSource = new MatTableDataSource<any>([]);
  readonly rowActions: RowAction[] = [
    { key: 'edit', label: 'Edit', icon: 'edit', color: 'blue' },
    { key: 'delete', label: 'Delete', icon: 'delete', color: 'red' }
  ];

  filterCode = '';
  filterName = '';
  filterHod = '';

  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.refresh();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.sort.active = 'departmentName';
    this.sort.direction = 'asc';
    this.sort.sortChange.emit({ active: 'departmentName', direction: 'asc' });
  }

  refresh(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (res) => { this.dataSource.data = res.data ?? []; this.applyFilter(); this.loading.set(false); },
      error: () => { this.notification.error('Load Failed', 'Could not load departments.'); this.loading.set(false); }
    });
  }

  applyFilter(): void {
    const code = this.filterCode.toLowerCase().trim();
    const name = this.filterName.toLowerCase().trim();
    const hod = this.filterHod.toLowerCase().trim();
    this.dataSource.filterPredicate = (row: any) => {
      const matchCode = !code || (row.depCode ?? '').toLowerCase().includes(code);
      const matchName = !name || (row.departmentName ?? '').toLowerCase().includes(name);
      const matchHod = !hod || (row.hodName ?? '').toLowerCase().includes(hod);
      return matchCode && matchName && matchHod;
    };
    this.dataSource.filter = `${code}|${name}|${hod}`;
  }

  onAction(key: string, row: any): void {
    switch (key) {
      case 'edit': this.openDialog(row); break;
      case 'delete': this.remove(row); break;
    }
  }

  openDialog(row?: any): void {
    const ref = this.dialog.open(DepartmentDialogComponent, {
      width: '560px',
      data: { department: row ?? null }
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.refresh();
    });
  }

  remove(row: any): void {
    if (!row?.depId) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Department',
        message: `Are you sure you want to delete "${row.departmentName}"? This action cannot be undone.`,
        confirmText: 'Delete',
        color: 'warn'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.service.remove(row.depId).subscribe({
        next: () => { this.notification.success('Deleted', 'Department removed.'); this.refresh(); },
        error: () => this.notification.error('Delete Failed', 'Could not delete department.')
      });
    });
  }
}
