import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { RoleService } from '../../../core/services/role.service';
import { NotificationService } from '../../../core/services/notification.service';


@Component({
  selector: 'app-role-edit',
  imports: [
    ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule, MatCheckboxModule,
    MatButtonModule, MatIconModule, MatProgressBarModule, MatExpansionModule
  ],
  templateUrl: './role-edit.html',
  styleUrl: './role-edit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(RoleService);
  private readonly notification = inject(NotificationService);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly groupedPermissions = signal<any[]>([]);
  readonly selected = signal<Set<number>>(new Set());

  private roleId: number | null = null;

  readonly form = this.fb.group({
    roleName: ['', Validators.required]
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.roleId = idParam && idParam !== 'new' ? Number(idParam) : null;

    forkJoin({
      perms: this.service.listPermissions(),
      role: this.roleId ? this.service.getRole(this.roleId) : of(null)
    }).subscribe({
      next: ({ perms, role }) => {
        this.groupedPermissions.set(perms.data ?? []);
        if (role?.data) {
          this.form.patchValue({ roleName: role.data.name });
          this.selected.set(new Set(role.data.permissionIds));
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error('Load Failed', 'Could not load role/permissions.');
        this.loading.set(false);
      }
    });
  }

  isSelected(id: number): boolean {
    return this.selected().has(id);
  }

  togglePermission(id: number, checked: boolean): void {
    const next = new Set(this.selected());
    if (checked) next.add(id); else next.delete(id);
    this.selected.set(next);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    const payload = {
      roleName: this.form.value.roleName ?? '',
      permissionIds: Array.from(this.selected())
    };
    const obs = this.roleId
      ? this.service.updateRole(this.roleId, payload)
      : this.service.createRole(payload);
    obs.subscribe({
      next: () => {
        this.notification.success('Saved', 'Role saved.');
        void this.router.navigate(['/admin/roles']);
      },
      error: () => {
        this.notification.error('Save Failed', 'Could not save role.');
        this.submitting.set(false);
      }
    });
  }
}
