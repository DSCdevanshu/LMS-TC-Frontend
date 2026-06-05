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
import { DesignationService } from '../../../core/services/designation.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DesignationDialogComponent } from './designation-dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { RowActionsComponent, RowAction } from '../../../shared/components/row-actions/row-actions';

@Component({
  selector: 'app-designation-list',
  imports: [
    FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressBarModule, MatSortModule,
    MatDialogModule, RowActionsComponent
  ],
  templateUrl: './designation-list.html',
  styleUrl: './designation-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DesignationListComponent implements OnInit, AfterViewInit {
  private readonly service = inject(DesignationService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly displayedColumns = ['title', 'totalEmployees', 'actions'];
  readonly dataSource = new MatTableDataSource<any>([]);
  readonly rowActions: RowAction[] = [
    { key: 'edit', label: 'Edit', icon: 'edit', color: 'blue' },
    { key: 'delete', label: 'Delete', icon: 'delete', color: 'red' }
  ];

  filterTitle = '';

  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.refresh();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.sort.active = 'title';
    this.sort.direction = 'asc';
    this.sort.sortChange.emit({ active: 'title', direction: 'asc' });
  }

  refresh(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (res) => { this.dataSource.data = res.data ?? []; this.applyFilter(); this.loading.set(false); },
      error: () => { this.notification.error('Load Failed', 'Could not load designations.'); this.loading.set(false); }
    });
  }

  applyFilter(): void {
    const title = this.filterTitle.toLowerCase().trim();
    this.dataSource.filterPredicate = (row: any) => {
      return !title || (row.title ?? '').toLowerCase().includes(title);
    };
    this.dataSource.filter = title;
  }

  onAction(key: string, row: any): void {
    switch (key) {
      case 'edit': this.openDialog(row); break;
      case 'delete': this.remove(row); break;
    }
  }

  openDialog(row?: any): void {
    const ref = this.dialog.open(DesignationDialogComponent, {
      width: '480px',
      data: { designation: row ?? null }
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.refresh();
    });
  }

  remove(row: any): void {
    if (!row?.designationId) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Designation',
        message: `Are you sure you want to delete "${row.title}"? This action cannot be undone.`,
        confirmText: 'Delete',
        color: 'warn'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.service.remove(row.designationId).subscribe({
        next: () => { this.notification.success('Deleted', 'Designation removed.'); this.refresh(); },
        error: () => this.notification.error('Delete Failed', 'Could not delete designation.')
      });
    });
  }
}
