import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RoleService } from '../../../core/services/role.service';
import { NotificationService } from '../../../core/services/notification.service';


@Component({
  selector: 'app-role-list',
  imports: [RouterLink, MatTableModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './role-list.html',
  styleUrl: './role-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleListComponent implements OnInit {
  private readonly service = inject(RoleService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly displayedColumns = ['id', 'name', 'permissionCount', 'actions'];
  readonly dataSource = new MatTableDataSource<any>([]);

  ngOnInit(): void { this.refresh(); }

  refresh(): void {
    this.loading.set(true);
    this.service.listRoles().subscribe({
      next: (res: any) => { this.dataSource.data = res?.data ?? []; this.loading.set(false); },
      error: () => { this.notification.error('Load Failed', 'Could not load roles.'); this.loading.set(false); }
    });
  }

  edit(row: any): void {
    void this.router.navigate(['/admin/roles', row?.id]);
  }

  remove(row: any): void {
    if (!confirm(`Delete role ${row?.name}?`)) return;
    this.service.removeRole(row?.id).subscribe({
      next: () => { this.notification.success('Deleted', 'Role removed.'); this.refresh(); },
      error: () => this.notification.error('Delete Failed', 'Could not delete role.')
    });
  }
}
