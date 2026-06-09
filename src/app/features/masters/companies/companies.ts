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
import { MasterService } from '../../../core/services/master.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CompanyDialogComponent } from './company-dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { RowActionsComponent, RowAction } from '../../../shared/components/row-actions/row-actions';

@Component({
  selector: 'app-companies',
  imports: [
    FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressBarModule, MatSortModule,
    MatDialogModule, RowActionsComponent
  ],
  templateUrl: './companies.html',
  styleUrl: './companies.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompaniesComponent implements OnInit, AfterViewInit {
  private readonly service = inject(MasterService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly displayedColumns = ['companyCode', 'companyName', 'totalEmployees', 'actions'];
  readonly dataSource = new MatTableDataSource<any>([]);
  readonly rowActions: RowAction[] = [
    { key: 'edit', label: 'Edit', icon: 'edit', color: 'blue' },
    { key: 'delete', label: 'Delete', icon: 'delete', color: 'red' }
  ];

  filterCode = '';
  filterName = '';

  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.refresh();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.sort.active = 'companyName';
    this.sort.direction = 'asc';
    this.sort.sortChange.emit({ active: 'companyName', direction: 'asc' });
  }

  refresh(): void {
    this.loading.set(true);
    this.service.getCompanies().subscribe({
      next: (res) => { this.dataSource.data = res.data ?? []; this.applyFilter(); this.loading.set(false); },
      error: (err) => { this.notification.error('Load Failed', err?.message || 'Could not load companies.'); this.loading.set(false); }
    });
  }

  applyFilter(): void {
    const code = this.filterCode.toLowerCase().trim();
    const name = this.filterName.toLowerCase().trim();
    this.dataSource.filterPredicate = (row: any) => {
      const matchCode = !code || (row.companyCode ?? '').toLowerCase().includes(code);
      const matchName = !name || (row.companyName ?? '').toLowerCase().includes(name);
      return matchCode && matchName;
    };
    this.dataSource.filter = `${code}|${name}`;
  }

  onAction(key: string, row: any): void {
    switch (key) {
      case 'edit': this.openDialog(row); break;
      case 'delete': this.remove(row); break;
    }
  }

  openDialog(row?: any): void {
    const ref = this.dialog.open(CompanyDialogComponent, {
      width: '480px',
      data: { company: row ?? null }
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.refresh();
    });
  }

  remove(row: any): void {
    if (!row?.companyId) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Company',
        message: `Are you sure you want to delete "${row.companyName}"? This action cannot be undone.`,
        confirmText: 'Delete',
        color: 'warn'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.service.deleteCompany(row.companyId).subscribe({
        next: (res) => { this.notification.success('Deleted', res?.message || 'Company removed.'); this.refresh(); },
        error: (err) => this.notification.error('Delete Failed', err?.error?.message || 'Could not delete company.')
      });
    });
  }
}
