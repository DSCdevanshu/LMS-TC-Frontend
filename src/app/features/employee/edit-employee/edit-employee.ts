import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { EmployeeService } from '../../../core/services/employee.service';
import { MasterService } from '../../../core/services/master.service';
import { LookupService } from '../../../core/services/lookup.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LookupFlags } from '../../../core/services/lookup.service';
import { NavHistoryService } from '../../../core/services/nav-history.service';
import { DateInputMaskDirective } from '../../../core/directives/date-input-mask.directive';

@Component({
  selector: 'app-edit-employee',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatButtonModule, MatIconModule, MatProgressBarModule, MatCardModule, MatDividerModule, MatCheckboxModule,
    DateInputMaskDirective
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
  private readonly masterService = inject(MasterService);
  private readonly lookupService = inject(LookupService);
  private readonly notification = inject(NotificationService);
  private readonly navHistory = inject(NavHistoryService);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly departments = signal<any[]>([]);
  readonly designations = signal<any[]>([]);
  readonly managers = signal<any[]>([]);
  readonly companies = signal<any[]>([]);
  readonly locations = signal<any[]>([]);
  readonly photoPreview = signal<string | null>(null);
  readonly photoChanged = signal(false);
  readonly showDeleteConfirm = signal(false);
  private selectedPhoto: File | null = null;

  private employeeId = 0;

  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    middleName: [''],
    lastName: ['', Validators.required],
    fathersName: [''],
    mothersName: [''],
    dateOfBirth: [null as Date | null, Validators.required],
    hireDate: [null as Date | null, Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', Validators.minLength(10)],
    gender: [''],
    departmentId: [0, Validators.required],
    designationId: [0, Validators.required],
    companyId: [null as number | null, Validators.required],
    locationId: [null as number | null, Validators.required],
    canWorkFromHome: [false],
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
      mgrs: this.lookupService.getDropdownData(LookupFlags.Managers),
      companies: this.masterService.getCompanies(),
      locations: this.masterService.getLocations()
    }).subscribe({
      next: ({ detail, depts, desigs, mgrs, companies, locations }) => {
        const e = detail.data;
        this.departments.set(depts.data ?? []);
        this.designations.set(desigs.data ?? []);
        this.managers.set(mgrs.data ?? []);
        this.companies.set(companies.data ?? []);
        this.locations.set(locations.data ?? []);
        if (e) {
          this.form.patchValue({
            firstName: e.firstName ?? '',
            middleName: e.middleName ?? '',
            lastName: e.lastName ?? '',
            fathersName: e.fathersName ?? '',
            mothersName: e.mothersName ?? '',
            dateOfBirth: e.dateOfBirth ? new Date(e.dateOfBirth) : null,
            hireDate: e.hireDate ? new Date(e.hireDate) : null,
            email: e.emailID ?? '',
            mobile: e.mobile ?? '',
            gender: e.gender ?? '',
            departmentId: e.departmentId,
            designationId: e.designationId,
            companyId: e.companyId ?? null,
            locationId: e.locationId ?? null,
            canWorkFromHome: e.canWorkFromHome ?? false,
            address: e.address ?? '',
            pan: e.pan ?? '',
            aadhaarCard: e.aadhaarCard ?? '',
            bankAccountNumber: e.bankAccountNumber ?? '',
            reportingManagerIds: e.reportingManagerIds ?? []
          });
          if (e.photoUrl) this.photoPreview.set(e.photoUrl);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.notification.error('Load Failed', err?.message || 'Unable to load employee.');
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.navHistory.goBack();
  }

  confirmRemovePhoto(): void {
    this.showDeleteConfirm.set(true);
  }

  cancelRemovePhoto(): void {
    this.showDeleteConfirm.set(false);
  }

  onRemovePhoto(): void {
    this.showDeleteConfirm.set(false);
    this.employeeService.removePhoto(this.employeeId).subscribe({
      next: () => {
        this.photoPreview.set(null);
        this.selectedPhoto = null;
        this.photoChanged.set(false);
        this.notification.success('Removed', 'Photo removed successfully.');
      },
      error: (err) => this.notification.error('Failed', err?.message || 'Unable to remove photo.')
    });
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      this.notification.error('File Too Large', 'Photo must be less than 2 MB.');
      return;
    }
    this.selectedPhoto = file;
    this.photoChanged.set(true);
    const reader = new FileReader();
    reader.onload = () => this.photoPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    const v = this.form.getRawValue();
    this.employeeService.update(this.employeeId, {
      firstName: v.firstName ?? '',
      middleName: v.middleName,
      lastName: v.lastName ?? '',
      fathersName: v.fathersName,
      mothersName: v.mothersName,
      dateOfBirth: v.dateOfBirth instanceof Date ? this.formatDate(v.dateOfBirth) : (v.dateOfBirth ?? ''),
      hireDate: v.hireDate instanceof Date ? this.formatDate(v.hireDate) : (v.hireDate ?? null),
      email: v.email ?? '',
      mobile: v.mobile,
      gender: v.gender,
      departmentId: v.departmentId ?? 0,
      designationId: v.designationId ?? 0,
      companyId: v.companyId ?? 0,
      locationId: v.locationId ?? 0,
      canWorkFromHome: v.canWorkFromHome ?? false,
      address: v.address,
      pan: v.pan,
      aadhaarCard: v.aadhaarCard,
      bankAccountNumber: v.bankAccountNumber,
      reportingManagerIds: v.reportingManagerIds ?? []
    }).subscribe({
      next: (res) => {
        if (this.selectedPhoto) {
          this.employeeService.updatePhoto(this.employeeId, this.selectedPhoto).subscribe({
            next: () => {
              this.notification.success('Updated', res.message || 'Employee updated.');
              this.submitting.set(false);
              void this.router.navigate(['/employees', this.employeeId]);
            },
            error: (err) => {
              this.notification.error('Photo Failed', err?.message || 'Employee saved but photo upload failed.');
              this.submitting.set(false);
            }
          });
        } else {
          this.notification.success('Updated', res.message || 'Employee updated.');
          this.submitting.set(false);
          void this.router.navigate(['/employees', this.employeeId]);
        }
      },
      error: (err) => {
        this.notification.error('Update Failed', err?.message || 'Unable to update employee.');
        this.submitting.set(false);
      }
    });
  }

  private formatDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  }
}
