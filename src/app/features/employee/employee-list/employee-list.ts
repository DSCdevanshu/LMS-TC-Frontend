import { ChangeDetectionStrategy, Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { EmployeeService } from '../../../core/services/employee.service';
import { LookupService } from '../../../core/services/lookup.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LookupFlags } from '../../../core/services/lookup.service';

@Component({
  selector: 'app-employee-list',
  imports: [
    ReactiveFormsModule, RouterLink,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressBarModule, MatChipsModule
  ],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly lookupService = inject(LookupService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly departments = signal<any[]>([]);
  readonly designations = signal<any[]>([]);
  readonly displayedColumns = ['empCode', 'empName', 'emailID', 'departmentName', 'designationName', 'status', 'actions'];
  readonly dataSource = new MatTableDataSource<any>([]);

  readonly filterForm = this.fb.group({
    searchText: [''],
    departmentId: [0],
    designationId: [0],
    status: ['']
  });

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.loadLookups();
    this.search();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  search(): void {
    const v = this.filterForm.value;
    this.loading.set(true);
    this.employeeService.list({
      searchText: v.searchText || null,
      departmentId: v.departmentId || 0,
      designationId: v.designationId || 0,
      status: v.status || null
    }).subscribe({
      next: (res) => {
        this.dataSource.data = res.data ?? [];
        this.loading.set(false);
      },
      error: () => {
        this.notification.error('Load Failed', 'Unable to load employees.');
        this.loading.set(false);
      }
    });
  }

  reset(): void {
    this.filterForm.reset({ searchText: '', departmentId: 0, designationId: 0, status: '' });
    this.search();
  }

  onView(row: any): void {
    void this.router.navigate(['/employees', row?.userId]);
  }

  onEdit(row: any): void {
    void this.router.navigate(['/employees', row?.userId, 'edit']);
  }

  onDelete(row: any): void {
    if (!confirm(`Delete employee ${row?.empName}?`)) return;
    this.employeeService.remove(row?.userId).subscribe({
      next: () => {
        this.notification.success('Deleted', `${row.empName} removed.`);
        this.search();
      },
      error: () => this.notification.error('Delete Failed', 'Could not delete employee.')
    });
  }

  private loadLookups(): void {
    this.lookupService.getDropdownData(LookupFlags.Departments).subscribe(r => this.departments.set(r.data ?? []));
    this.lookupService.getDropdownData(LookupFlags.Designations).subscribe(r => this.designations.set(r.data ?? []));
  }
}
