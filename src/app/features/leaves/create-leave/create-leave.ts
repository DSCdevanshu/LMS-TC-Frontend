import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { LeaveService } from '../../../core/services/leave.service';
import { LookupService } from '../../../core/services/lookup.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LookupFlags } from '../../../core/services/lookup.service';
import { DateInputMaskDirective } from '../../../core/directives/date-input-mask.directive';
import { NavHistoryService } from '../../../core/services/nav-history.service';

@Component({
  selector: 'app-create-leave',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatButtonModule, MatIconModule, MatCardModule,
    DateInputMaskDirective
  ],
  templateUrl: './create-leave.html',
  styleUrl: './create-leave.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateLeaveComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly leaveService = inject(LeaveService);
  private readonly lookup = inject(LookupService);
  private readonly notification = inject(NotificationService);
  private readonly navHistory = inject(NavHistoryService);

  readonly submitting = signal(false);
  readonly leaveTypes = signal<any[]>([]);

  readonly form = this.fb.group({
    leaveTypeId: [0, [Validators.required, Validators.min(1)]],
    startDate: [null as Date | null, Validators.required],
    endDate: [null as Date | null, Validators.required],
    empRemarks: ['']
  });

  ngOnInit(): void {
    this.lookup.getDropdownData(LookupFlags.LeaveTypes).subscribe(r => this.leaveTypes.set(r.data ?? []));
  }

  goBack(): void {
    this.navHistory.goBack();
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.submitting.set(true);
    this.leaveService.submit({
      leaveTypeId: v.leaveTypeId ?? 0,
      startDate: this.iso(v.startDate!),
      endDate: this.iso(v.endDate!),
      empRemarks: v.empRemarks
    }).subscribe({
      next: (res) => {
        this.notification.success('Submitted', res.message || 'Leave request submitted.');
        this.submitting.set(false);
        void this.router.navigate(['/leaves/my-leaves']);
      },
      error: () => {
        this.notification.error('Submit Failed', 'Could not submit leave request.');
        this.submitting.set(false);
      }
    });
  }

  private iso(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
}
