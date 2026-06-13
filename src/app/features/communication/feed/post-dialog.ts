import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommunicationService } from '../../../core/services/communication.service';
import { LookupService } from '../../../core/services/lookup.service';
import { NotificationService } from '../../../core/services/notification.service';

interface PickedFile {
  file: File;
  previewUrl: string | null;
}

@Component({
  selector: 'app-post-dialog',
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatCheckboxModule, MatButtonModule, MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>New Post</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>What do you want to share?</mat-label>
          <textarea matInput rows="4" formControlName="body"></textarea>
          <mat-error>Body is required</mat-error>
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
            <mat-label>Kind</mat-label>
            <input matInput formControlName="kind" />
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

        @if (files().length) {
          <div class="previews">
            @for (f of files(); track f.file.name + $index) {
              <div class="thumb">
                @if (f.previewUrl) {
                  <img [src]="f.previewUrl" alt="preview" />
                } @else {
                  <div class="file-chip"><mat-icon>description</mat-icon><span>{{ f.file.name }}</span></div>
                }
                <button type="button" class="remove" (click)="removeFile($index)" aria-label="Remove">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }
          </div>
        }

        <div class="toolbar">
          <button type="button" mat-stroked-button (click)="fileInput.click()">
            <mat-icon>image</mat-icon> Add photos / files
          </button>
          <mat-checkbox formControlName="isPinned">Pin to top</mat-checkbox>
        </div>
        <input #fileInput type="file" hidden multiple
               accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
               (change)="onFilesPicked($event)" />
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="ref.close()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving()">
        {{ saving() ? 'Posting...' : 'Post' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; }
    .dialog-form { display: flex; flex-direction: column; gap: 16px; width: 100%; padding: 16px 0 8px; }
    .full { width: 100%; }
    .row { display: flex; gap: 16px; flex-wrap: wrap; }
    .row mat-form-field { flex: 1 1 160px; }
    .previews { display: flex; flex-wrap: wrap; gap: 10px; }
    .thumb { position: relative; width: 96px; height: 96px; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; }
    .thumb img { width: 100%; height: 100%; object-fit: cover; }
    .file-chip { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 4px; background: #f3f4f6; color: #6b7280; font-size: 11px; text-align: center; }
    .file-chip span { max-width: 88px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .remove { position: absolute; top: 2px; right: 2px; border: none; background: rgba(0,0,0,0.55); color: #fff; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .remove mat-icon { font-size: 16px; height: 16px; width: 16px; }
    .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CommunicationService);
  private readonly lookup = inject(LookupService);
  private readonly notification = inject(NotificationService);
  protected readonly ref = inject(MatDialogRef<PostDialogComponent>);

  readonly saving = signal(false);
  readonly categories = signal<any[]>([]);
  readonly files = signal<PickedFile[]>([]);
  readonly statuses = ['Draft', 'Published', 'Archived'];

  readonly form = this.fb.group({
    title: [''],
    body: ['', Validators.required],
    categoryId: [null as number | null],
    kind: [''],
    status: ['Published'],
    isPinned: [false]
  });

  ngOnInit(): void {
    this.lookup.getDropdownData('GetPostsCategoryDropDown').subscribe({
      next: (res) => this.categories.set(res.data ?? [])
    });
  }

  onFilesPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const picked = Array.from(input.files ?? []);
    const mapped: PickedFile[] = picked.map(file => ({
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    this.files.update(list => [...list, ...mapped]);
    input.value = '';
  }

  removeFile(index: number): void {
    this.files.update(list => {
      const target = list[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return list.filter((_, i) => i !== index);
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const payload = {
      title: v.title || null,
      body: v.body ?? '',
      categoryId: v.categoryId != null && v.categoryId !== ('' as any) ? Number(v.categoryId) : null,
      kind: v.kind || null,
      status: v.status ?? 'Published',
      isPinned: v.isPinned ?? false,
      attachments: this.files().map(f => f.file)
    };
    this.service.createPost(payload).subscribe({
      next: (res) => {
        this.notification.success('Posted', res?.message || 'Post created.');
        this.ref.close(true);
      },
      error: (err) => {
        this.notification.error('Failed', err?.message || 'Could not save post.');
        this.saving.set(false);
      }
    });
  }
}
