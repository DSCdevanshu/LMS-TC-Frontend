import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EmployeeService } from '../../../core/services/employee.service';
import { NotificationService } from '../../../core/services/notification.service';


@Component({
  selector: 'app-create-employee',
  imports: [
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './create-employee.html',
  styleUrl: './create-employee.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateEmployeeComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly hidePassword = signal(true);
  readonly departments = signal<any[]>([]);
  readonly designations = signal<any[]>([]);
  readonly managers = signal<any[]>([]);
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
    phoneNumber: [''],
    hireDate: [null as Date | null, Validators.required],
    designationId: [null as number | null, Validators.required],
    departmentId: [null as number | null, Validators.required],
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

  togglePassword(): void {
    this.hidePassword.update(v => !v);
  }

  onPhotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.employeeForm.patchValue({ photo: null });
      this.selectedPhotoName.set('No file selected');
      return;
    }

    this.employeeForm.patchValue({ photo: file });
    this.selectedPhotoName.set(file.name);
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
      managers: this.employeeService.getDropdownData('GetAllEmployeesDropDown')
    }).subscribe({
      next: ({ departments, designations, managers }) => {
        this.departments.set(departments.data ?? []);
        this.designations.set(designations.data ?? []);
        this.managers.set(managers.data ?? []);
      },
      error: () => {
        this.notification.error('Load Failed', 'Unable to load dropdown values.');
      },
      complete: () => this.isLoading.set(false)
    });
  }
}
