import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { EmployeeService } from '../../core/services/employee.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-directory',
  standalone: true,
  imports: [MatTableModule, MatFormFieldModule, MatInputModule, MatIconModule, MatProgressBarModule],
  templateUrl: './directory.html',
  styleUrl: './directory.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DirectoryComponent implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly notification = inject(NotificationService);

  readonly loading = signal(false);
  readonly displayedColumns = ['empCode', 'empName', 'emailID', 'departmentName', 'designationName', 'phoneNumber'];
  readonly dataSource = new MatTableDataSource<any>([]);

  ngOnInit(): void {
    this.loadDirectory();
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  private loadDirectory(): void {
    this.loading.set(true);
    this.employeeService.list({ searchText: null, departmentId: 0, designationId: 0, status: 'Active' }).subscribe({
      next: (res: any) => { this.dataSource.data = res?.data ?? []; this.loading.set(false); },
      error: () => { this.notification.error('Load Failed', 'Could not load directory.'); this.loading.set(false); }
    });
  }
}
