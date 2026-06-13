import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { EmployeeService } from '../../../core/services/employee.service';
import { MasterService } from '../../../core/services/master.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NavHistoryService } from '../../../core/services/nav-history.service';
import { DateInputMaskDirective } from '../../../core/directives/date-input-mask.directive';


@Component({
  selector: 'app-create-employee',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressBarModule,
    MatCheckboxModule,
    DateInputMaskDirective
  ],
  templateUrl: './create-employee.html',
  styleUrl: './create-employee.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateEmployeeComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly masterService = inject(MasterService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly navHistory = inject(NavHistoryService);

  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly hidePassword = signal(true);
  readonly departments = signal<any[]>([]);
  readonly designations = signal<any[]>([]);
  readonly managers = signal<any[]>([]);
  readonly companies = signal<any[]>([]);
  readonly locations = signal<any[]>([]);
  readonly photoPreview = signal<string | null>(null);
  readonly selectedPhotoName = signal<string>('No file selected');

  readonly employeeForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    empCode: ['', Validators.required],
    firstName: ['', Validators.required],
    middleName: [''],
    lastName: ['', Validators.required],
    fathersName: [''],
    mothersName: [''],
    dateOfBirth: [null as Date | null, Validators.required],
    gender: ['', Validators.required],
    address: [''],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.minLength(10)],
    hireDate: [null as Date | null, Validators.required],
    designationId: [null as number | null, Validators.required],
    departmentId: [null as number | null, Validators.required],
    companyId: [null as number | null, Validators.required],
    locationId: [null as number | null, Validators.required],
    canWorkFromHome: [false],
    reportingManagerIds: [[] as number[]],
    pan: [''],
    aadhaarCard: [''],
    bankAccountNumber: [''],
    photo: [null as File | null]
  });

  readonly genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' }
  ];

  ngOnInit(): void {
    this.loadLookups();
  }

  goBack(): void {
    this.navHistory.goBack();
  }

  togglePassword(): void {
    this.hidePassword.update(v => !v);
  }

  onPhotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.employeeForm.patchValue({ photo: null });
      this.selectedPhotoName.set('No file selected');
      this.photoPreview.set(null);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.notification.error('File Too Large', 'Photo must be less than 2 MB.');
      return;
    }

    this.employeeForm.patchValue({ photo: file });
    this.selectedPhotoName.set(file.name);
    const reader = new FileReader();
    reader.onload = () => this.photoPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  clearPhoto(): void {
    this.employeeForm.patchValue({ photo: null });
    this.selectedPhotoName.set('No file selected');
    this.photoPreview.set(null);
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    const value = this.employeeForm.getRawValue();

    this.isSubmitting.set(true);

    this.employeeService
      .createEmployee({
        username: value.username ?? '',
        password: value.password ?? '',
        empCode: value.empCode ?? '',
        firstName: value.firstName ?? '',
        middleName: value.middleName,
        lastName: value.lastName ?? '',
        fathersName: value.fathersName,
        mothersName: value.mothersName,
        dateOfBirth: value.dateOfBirth instanceof Date ? this.formatDate(value.dateOfBirth) : (value.dateOfBirth ?? ''),
        gender: value.gender ?? '',
        address: value.address,
        email: value.email ?? '',
        phoneNumber: value.phoneNumber,
        hireDate: value.hireDate instanceof Date ? this.formatDate(value.hireDate) : (value.hireDate ?? ''),
        designationId: value.designationId ?? 0,
        departmentId: value.departmentId ?? 0,
        companyId: value.companyId ?? 0,
        locationId: value.locationId ?? 0,
        canWorkFromHome: value.canWorkFromHome ?? false,
        reportingManagerIds: value.reportingManagerIds ?? [],
        pan: value.pan,
        aadhaarCard: value.aadhaarCard,
        bankAccountNumber: value.bankAccountNumber,
        photo: value.photo
      })
      .subscribe({
        next: (response) => {
          this.notification.success('Employee Created', response.message || 'Employee created successfully.');
          this.isSubmitting.set(false);
          this.employeeForm.reset({
            reportingManagerIds: [],
            designationId: null,
            departmentId: null,
            companyId: null,
            locationId: null,
            canWorkFromHome: false,
            photo: null
          });
          this.selectedPhotoName.set('No file selected');
          void this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          const message =
            typeof error.error === 'string'
              ? error.error
              : error.error?.message ?? error.error?.error ?? 'Unable to create employee.';
          this.notification.error('Create Employee Failed', message);
          this.isSubmitting.set(false);
        }
      });
  }

  private formatDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${yyyy}-${mm}-${dd}`; // ISO format for backend, displayed as dd/mm/yyyy
  }

  private loadLookups(): void {
    this.isLoading.set(true);

    forkJoin({
      departments: this.employeeService.getDropdownData('GetDepartmentDropdown'),
      designations: this.employeeService.getDropdownData('GetDesignationDropdown'),
      managers: this.employeeService.getDropdownData('GetAllEmployeesDropDown'),
      companies: this.masterService.getCompanies(),
      locations: this.masterService.getLocations()
    }).subscribe({
      next: ({ departments, designations, managers, companies, locations }) => {
        this.departments.set(departments.data ?? []);
        this.designations.set(designations.data ?? []);
        this.managers.set(managers.data ?? []);
        this.companies.set(companies.data ?? []);
        this.locations.set(locations.data ?? []);
      },
      error: (err) => {
        this.notification.error('Load Failed', err?.message || 'Unable to load dropdown values.');
      },
      complete: () => this.isLoading.set(false)
    });
  }
}
