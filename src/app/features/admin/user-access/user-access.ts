import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { UserAccessService } from '../../../core/services/user-access.service';
import { RoleService } from '../../../core/services/role.service';
import { LookupService } from '../../../core/services/lookup.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LookupFlags } from '../../../core/services/lookup.service';

@Component({
  selector: 'app-user-access',
  imports: [
    ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressBarModule, MatExpansionModule, MatCheckboxModule
  ],
  templateUrl: './user-access.html',
  styleUrl: './user-access.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserAccessComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly accessService = inject(UserAccessService);
  private readonly roleService = inject(RoleService);
  private readonly lookup = inject(LookupService);
  private readonly notification = inject(NotificationService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly users = signal<any[]>([]);
  readonly roles = signal<any[]>([]);
  readonly groupedPermissions = signal<any[]>([]);
  readonly selectedRoles = signal<Set<number>>(new Set());
  readonly selectedPerms = signal<Set<number>>(new Set());

  readonly userControl = this.fb.control<number | null>(null);

  ngOnInit(): void {
    forkJoin({
      users: this.lookup.getDropdownData(LookupFlags.Employees),
      roles: this.roleService.listRoles(),
      perms: this.roleService.listPermissions()
    }).subscribe({
      next: ({ users, roles, perms }) => {
        this.users.set(users.data ?? []);
        this.roles.set(roles.data ?? []);
        this.groupedPermissions.set(perms.data ?? []);
        this.loading.set(false);
      },
      error: () => { this.notification.error('Load Failed', 'Could not load lookup data.'); this.loading.set(false); }
    });

    this.userControl.valueChanges.pipe(
      switchMap((userId) => userId ? this.accessService.getAccess(userId) : of(null))
    ).subscribe((res) => {
      if (res?.data) {
        this.selectedRoles.set(new Set(res.data.roleIds));
        this.selectedPerms.set(new Set(res.data.customPermissionIds));
      } else {
        this.selectedRoles.set(new Set());
        this.selectedPerms.set(new Set());
      }
    });
  }

  toggleRole(id: number, checked: boolean): void {
    const next = new Set(this.selectedRoles());
    if (checked) next.add(id); else next.delete(id);
    this.selectedRoles.set(next);
  }

  togglePerm(id: number, checked: boolean): void {
    const next = new Set(this.selectedPerms());
    if (checked) next.add(id); else next.delete(id);
    this.selectedPerms.set(next);
  }

  isRoleSelected(id: number): boolean { return this.selectedRoles().has(id); }
  isPermSelected(id: number): boolean { return this.selectedPerms().has(id); }

  save(): void {
    const userId = this.userControl.value;
    if (!userId) return;
    this.saving.set(true);
    this.accessService.updateAccess(userId, {
      roleIds: Array.from(this.selectedRoles()),
      customPermissionIds: Array.from(this.selectedPerms())
    }).subscribe({
      next: () => { this.notification.success('Saved', 'Access updated.'); this.saving.set(false); },
      error: () => { this.notification.error('Save Failed', 'Could not update access.'); this.saving.set(false); }
    });
  }
}
