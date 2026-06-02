import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { EmployeeService } from '../../../core/services/employee.service';
import { LookupService } from '../../../core/services/lookup.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LookupFlags } from '../../../core/services/lookup.service';

@Component({
  selector: 'app-edit-employee',
  imports: [
    ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressBarModule, MatCardModule
  ],
  templateUrl: './edit-employee.html',
  styleUrl: './edit-employee.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditEmployeeComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeeService = inject(EmployeeService);
  private readonly lookupService = inject(LookupService);
  private readonly notification = inject(NotificationService);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly departments = signal<any[]>([]);
  readonly designations = signal<any[]>([]);
  readonly managers = signal<any[]>([]);

  private employeeId = 0;

  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    middleName: [''],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobile: [''],
    departmentId: [0, Validators.required],
    designationId: [0, Validators.required],
    address: [''],
    pan: [''],
    aadhaarCard: [''],
    bankAccountNumber: [''],
    reportingManagerIds: [[] as number[]]
  });

  ngOnInit(): void {
    this.employeeId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.employeeId) return;

    forkJoin({
      detail: this.employeeService.getById(this.employeeId),
      depts: this.lookupService.getDropdownData(LookupFlags.Departments),
      desigs: this.lookupService.getDropdownData(LookupFlags.Designations),
      mgrs: this.lookupService.getDropdownData(LookupFlags.Managers)
    }).subscribe({
      next: ({ detail, depts, desigs, mgrs }) => {
        const e = detail.data;
        this.departments.set(depts.data ?? []);
        this.designations.set(desigs.data ?? []);
        this.managers.set(mgrs.data ?? []);
        if (e) {
          this.form.patchValue({
            firstName: e.firstName ?? '',
            middleName: e.middleName ?? '',
            lastName: e.lastName ?? '',
            email: e.emailID ?? '',
            mobile: e.mobile ?? '',
            departmentId: e.departmentId,
            designationId: e.designationId,
            address: e.address ?? '',
            pan: e.pan ?? '',
            aadhaarCard: e.aadhaarCard ?? '',
            bankAccountNumber: e.bankAccountNumber ?? '',
            reportingManagerIds: e.reportingManagerIds ?? []
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error('Load Failed', 'Unable to load employee.');
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    const v = this.form.getRawValue();
    this.employeeService.update(this.employeeId, {
      firstName: v.firstName ?? '',
      middleName: v.middleName,
      lastName: v.lastName ?? '',
      email: v.email ?? '',
      mobile: v.mobile,
      departmentId: v.departmentId ?? 0,
      designationId: v.designationId ?? 0,
      address: v.address,
      pan: v.pan,
      aadhaarCard: v.aadhaarCard,
      bankAccountNumber: v.bankAccountNumber,
      reportingManagerIds: v.reportingManagerIds ?? []
    }).subscribe({
      next: (res) => {
        this.notification.success('Updated', res.message || 'Employee updated.');
        this.submitting.set(false);
        void this.router.navigate(['/employees', this.employeeId]);
      },
      error: () => {
        this.notification.error('Update Failed', 'Unable to update employee.');
        this.submitting.set(false);
      }
    });
  }
}
