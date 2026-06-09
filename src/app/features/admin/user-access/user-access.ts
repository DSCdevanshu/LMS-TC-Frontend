import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
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
    ReactiveFormsModule, MatFormFieldModule, MatSelectModule,
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
  readonly allEmployees = signal<any[]>([]);
  readonly departments = signal<any[]>([]);
  readonly selectedDepId = signal<number | null>(null);
  readonly roles = signal<any[]>([]);
  readonly groupedPermissions = signal<any[]>([]);
  readonly selectedRoles = signal<Set<number>>(new Set());
  readonly selectedPerms = signal<Set<number>>(new Set());

  readonly filteredEmployees = computed(() => {
    const depId = this.selectedDepId();
    const all = this.allEmployees();
    if (!depId) return all;
    return all.filter(e => +e.extraData1 === depId);
  });

  readonly userControl = this.fb.control<number | null>(null);

  ngOnInit(): void {
    forkJoin({
      employees: this.lookup.getDropdownData(LookupFlags.AuthorizedEmployees),
      departments: this.lookup.getDropdownData(LookupFlags.AuthorizedDepartments),
      perms: this.roleService.listPermissions()
    }).subscribe({
      next: ({ employees, departments, perms }) => {
        this.allEmployees.set(employees.data ?? []);
        this.departments.set(departments.data ?? []);
        this.groupedPermissions.set(perms.data ?? []);
        this.loading.set(false);
      },
      error: (err) => { this.notification.error('Load Failed', err?.message || 'Could not load lookup data.'); this.loading.set(false); }
    });

    this.userControl.valueChanges.pipe(
      switchMap((userId) => userId
        ? forkJoin({
            access: this.accessService.getAccess(userId),
            roles: this.roleService.listRoles()
          })
        : of(null))
    ).subscribe((res) => {
      if (res) {
        this.roles.set(res.roles.data ?? []);
        if (res.access?.data) {
          this.selectedRoles.set(new Set(res.access.data.roleIds));
          this.selectedPerms.set(new Set(res.access.data.customPermissionIds));
        } else {
          this.selectedRoles.set(new Set());
          this.selectedPerms.set(new Set());
        }
      } else {
        this.roles.set([]);
        this.selectedRoles.set(new Set());
        this.selectedPerms.set(new Set());
      }
    });
  }

  onDepartmentChange(depId: number | null): void {
    this.selectedDepId.set(depId);
    const currentUser = this.userControl.value;
    if (currentUser && depId) {
      const exists = this.filteredEmployees().some(e => +e.value === currentUser);
      if (!exists) this.userControl.setValue(null);
    }
  }

  toggleRole(id: number, checked: boolean): void {
    const nextRoles = new Set(this.selectedRoles());
    if (checked) nextRoles.add(id); else nextRoles.delete(id);
    this.selectedRoles.set(nextRoles);

    // Sync permissions based on all currently selected roles
    const nextPerms = new Set(this.selectedPerms());
    const role = this.roles().find(r => r.id === id);
    const permIds: number[] = role?.permissionIds ?? [];

    if (checked) {
      // Add this role's permissions
      for (const pid of permIds) nextPerms.add(pid);
    } else {
      // Remove permissions that aren't required by any other selected role
      const otherRolePerms = new Set<number>();
      for (const rid of nextRoles) {
        const r = this.roles().find(x => x.id === rid);
        for (const pid of (r?.permissionIds ?? [])) otherRolePerms.add(pid);
      }
      for (const pid of permIds) {
        if (!otherRolePerms.has(pid)) nextPerms.delete(pid);
      }
    }
    this.selectedPerms.set(nextPerms);
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
      error: (err) => { this.notification.error('Save Failed', err?.message || 'Could not update access.'); this.saving.set(false); }
    });
  }
}
