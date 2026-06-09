import { ChangeDetectionStrategy, Component, OnInit, inject, signal, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { RoleService } from '../../../core/services/role.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RowActionsComponent, RowAction } from '../../../shared/components/row-actions/row-actions';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { RoleNameDialog } from './role-name-dialog';

@Component({
  selector: 'app-role-list',
  imports: [
    FormsModule,
    MatTableModule, MatSortModule,
    MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressBarModule,
    RowActionsComponent
  ],
  templateUrl: './role-list.html',
  styleUrl: './role-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleListComponent implements OnInit, AfterViewInit {
  private readonly service = inject(RoleService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  @ViewChild(MatSort) sort!: MatSort;

  readonly loading = signal(false);
  readonly displayedColumns = ['id', 'name', 'permissionCount', 'actions'];
  readonly dataSource = new MatTableDataSource<any>([]);
  readonly rowActions: RowAction[] = [
    { key: 'edit', label: 'Edit', icon: 'edit', color: 'blue' },
    { key: 'delete', label: 'Delete', icon: 'delete', color: 'red' }
  ];

  filterName = '';

  ngOnInit(): void { this.refresh(); }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  applyFilter(): void {
    const term = this.filterName.trim().toLowerCase();
    this.dataSource.filter = term;
  }

  refresh(): void {
    this.loading.set(true);
    this.service.listRoles().subscribe({
      next: (res: any) => {
        this.dataSource.data = res?.data ?? [];
        this.dataSource.filterPredicate = (row: any, filter: string) =>
          (row.name ?? '').toLowerCase().includes(filter);
        this.loading.set(false);
      },
      error: (err) => { this.notification.error('Load Failed', err?.message || 'Could not load roles.'); this.loading.set(false); }
    });
  }

  onAction(key: string, row: any): void {
    if (key === 'edit') this.edit(row);
    else if (key === 'delete') this.remove(row);
  }

  edit(row: any): void {
    void this.router.navigate(['/admin/roles', row?.id]);
  }

  openNewRoleDialog(): void {
    const ref = this.dialog.open(RoleNameDialog, { width: '420px', panelClass: 'role-name-dialog' });
    ref.afterClosed().subscribe(name => {
      if (!name) return;
      this.loading.set(true);
      this.service.createRole({ roleName: name, permissionIds: [] }).subscribe({
        next: (res: any) => {
          this.notification.success('Created', res?.message || 'Role created.');
          const newId = res?.data;
          if (newId) {
            void this.router.navigate(['/admin/roles', newId]);
          } else {
            this.refresh();
          }
        },
        error: (err) => {
          this.notification.error('Create Failed', err?.message || 'Could not create role.');
          this.loading.set(false);
        }
      });
    });
  }

  remove(row: any): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Delete Role', message: `Are you sure you want to delete "${row?.name}"?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.service.removeRole(row?.id).subscribe({
        next: () => { this.notification.success('Deleted', 'Role removed.'); this.refresh(); },
        error: (err) => this.notification.error('Delete Failed', err?.message || 'Could not delete role.')
      });
    });
  }
}
