import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommunicationService } from '../../../core/services/communication.service';
import { LookupService } from '../../../core/services/lookup.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-policy-dialog',
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatCheckboxModule, MatButtonModule, MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>New Policy</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" />
          <mat-error>Title is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Body</mat-label>
          <textarea matInput rows="4" formControlName="body"></textarea>
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select formControlName="categoryId">
              <mat-option [value]="null">None</mat-option>
              @for (c of categories(); track c.value) {
                <mat-option [value]="+c.value!">{{ c.text }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Owner Department</mat-label>
            <mat-select formControlName="ownerDepartmentId">
              <mat-option [value]="null">None</mat-option>
              @for (d of departments(); track d.value) {
                <mat-option [value]="+d.value!">{{ d.text }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Kind</mat-label>
            <input matInput formControlName="kind" />
          </mat-form-field>
        </div>
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority">
              @for (p of priorities; track p) {
                <mat-option [value]="p">{{ p }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              @for (s of statuses; track s) {
                <mat-option [value]="s">{{ s }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Publish On</mat-label>
            <input matInput [matDatepicker]="pubPicker" formControlName="publishOn" />
            <mat-datepicker-toggle matIconSuffix [for]="pubPicker"></mat-datepicker-toggle>
            <mat-datepicker #pubPicker></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Expires On</mat-label>
            <input matInput [matDatepicker]="expPicker" formControlName="expiresOn" />
            <mat-datepicker-toggle matIconSuffix [for]="expPicker"></mat-datepicker-toggle>
            <mat-datepicker #expPicker></mat-datepicker>
          </mat-form-field>
        </div>
        <mat-checkbox formControlName="isPinned">Pin to top</mat-checkbox>

        <fieldset class="audience">
          <legend>Audience</legend>
          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Audience Type</mat-label>
              <mat-select formControlName="audienceFlag" (selectionChange)="onAudienceTypeChange($event.value)">
                <mat-option value="ALL">All</mat-option>
                @for (t of audienceTypes(); track t.value) {
                  <mat-option [value]="t.value">{{ t.text }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            @if (form.controls.audienceFlag.value && form.controls.audienceFlag.value !== 'ALL') {
              <mat-form-field appearance="outline">
                <mat-label>Target</mat-label>
                <mat-select formControlName="targetId">
                  @for (o of audienceTargets(); track o.value) {
                    <mat-option [value]="+o.value!">{{ o.text }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            }
          </div>
        </fieldset>

        @if (files().length) {
          <div class="attach-list">
            @for (f of files(); track f.name + $index) {
              <div class="attach-chip">
                <mat-icon>description</mat-icon>
                <span>{{ f.name }}</span>
                <button type="button" (click)="removeFile($index)" aria-label="Remove"><mat-icon>close</mat-icon></button>
              </div>
            }
          </div>
        }
        <button type="button" mat-stroked-button (click)="fileInput.click()">
          <mat-icon>attach_file</mat-icon> Add attachments
        </button>
        <input #fileInput type="file" hidden multiple (change)="onFilesPicked($event)" />
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="ref.close()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving()">
        {{ saving() ? 'Saving...' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; }
    .dialog-form { display: flex; flex-direction: column; gap: 16px; width: 100%; padding: 16px 0 8px; }
    .full { width: 100%; }
    .row { display: flex; gap: 16px; flex-wrap: wrap; }
    .row mat-form-field { flex: 1 1 160px; }
    .audience { border: 1px solid #dbeafe; border-radius: 8px; padding: 8px 12px; margin: 0; }
    .audience legend { font-size: 12px; color: #6b7280; padding: 0 4px; }
    .attach-list { display: flex; flex-direction: column; gap: 6px; }
    .attach-chip { display: flex; align-items: center; gap: 8px; background: #f3f4f6; border-radius: 6px; padding: 4px 8px; font-size: 13px; }
    .attach-chip span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .attach-chip button { border: none; background: transparent; cursor: pointer; color: #6b7280; display: flex; }
    .attach-chip mat-icon { font-size: 18px; height: 18px; width: 18px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PolicyDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CommunicationService);
  private readonly lookup = inject(LookupService);
  private readonly notification = inject(NotificationService);
  protected readonly ref = inject(MatDialogRef<PolicyDialogComponent>);
  protected readonly data = inject<{ policy: any }>(MAT_DIALOG_DATA);

  readonly saving = signal(false);
  readonly departments = signal<any[]>([]);
  readonly categories = signal<any[]>([]);
  readonly audienceTypes = signal<any[]>([]);
  readonly audienceTargets = signal<any[]>([]);
  readonly files = signal<File[]>([]);
  readonly priorities = ['Low', 'Normal', 'High'];
  readonly statuses = ['Draft', 'Published', 'Archived'];

  readonly form = this.fb.group({
    title: ['', Validators.required],
    body: [''],
    categoryId: [null as number | null],
    ownerDepartmentId: [null as number | null],
    kind: [''],
    priority: ['Normal'],
    status: ['Draft'],
    isPinned: [false],
    publishOn: [null as Date | null],
    expiresOn: [null as Date | null],
    audienceFlag: ['ALL'],
    targetId: [null as number | null]
  });

  ngOnInit(): void {
    this.lookup.getDropdownData('GetDepartmentDropdown').subscribe({
      next: (res) => this.departments.set(res.data ?? [])
    });
    this.lookup.getDropdownData('GetPolicyCategoryDropDown').subscribe({
      next: (res) => this.categories.set(res.data ?? [])
    });
    this.lookup.getDropdownData('GetPolicyAudienceTypeDropDown').subscribe({
      next: (res) => this.audienceTypes.set(res.data ?? [])
    });
  }

  onAudienceTypeChange(flag: string): void {
    this.form.patchValue({ targetId: null });
    this.audienceTargets.set([]);
    if (!flag || flag === 'ALL') return;
    this.lookup.getDropdownData(flag).subscribe({
      next: (res) => this.audienceTargets.set(res.data ?? [])
    });
  }

  onFilesPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const picked = Array.from(input.files ?? []);
    this.files.update(list => [...list, ...picked]);
    input.value = '';
  }

  removeFile(index: number): void {
    this.files.update(list => list.filter((_, i) => i !== index));
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    if (v.publishOn && v.expiresOn && new Date(v.expiresOn) <= new Date(v.publishOn)) {
      this.notification.error('Invalid Dates', 'Expiry date must be after the publish date.');
      return;
    }
    this.saving.set(true);
    const payload = {
      title: v.title ?? '',
      body: v.body || null,
      categoryId: v.categoryId != null && v.categoryId !== ('' as any) ? Number(v.categoryId) : null,
      kind: v.kind || null,
      priority: v.priority ?? 'Normal',
      isPinned: v.isPinned ?? false,
      publishOn: v.publishOn ? new Date(v.publishOn).toISOString() : null,
      expiresOn: v.expiresOn ? new Date(v.expiresOn).toISOString() : null,
      status: v.status ?? 'Draft',
      ownerDepartmentId: v.ownerDepartmentId != null ? Number(v.ownerDepartmentId) : null,
      audience: this.buildAudience(v),
      attachments: this.files()
    };
    this.service.createPolicy(payload).subscribe({
      next: (res) => {
        this.notification.success('Saved', res?.message || 'Policy created.');
        this.ref.close(true);
      },
      error: (err) => {
        this.notification.error('Failed', err?.message || 'Could not save policy.');
        this.saving.set(false);
      }
    });
  }

  private buildAudience(v: any): { TargetType: string; TargetId: number | null }[] | null {
    const flag = v.audienceFlag ?? 'ALL';
    if (flag === 'ALL') {
      return [{ TargetType: 'ALL', TargetId: null }];
    }
    const type = this.audienceTypes().find(t => t.value === flag);
    const targetType = type?.extraData1 ?? null;
    const targetId = v.targetId != null ? Number(v.targetId) : null;
    return [{ TargetType: targetType, TargetId: targetId }];
  }
}
