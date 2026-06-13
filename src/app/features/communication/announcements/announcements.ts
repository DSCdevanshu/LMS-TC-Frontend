import { ChangeDetectionStrategy, Component, OnInit, AfterViewInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommunicationService } from '../../../core/services/communication.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AnnouncementDialogComponent } from './announcement-dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { RowActionsComponent, RowAction } from '../../../shared/components/row-actions/row-actions';

@Component({
  selector: 'app-announcements',
  imports: [
    FormsModule, DatePipe, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressBarModule, MatSortModule,
    MatChipsModule, MatDialogModule, RowActionsComponent
  ],
  templateUrl: './announcements.html',
  styleUrl: './announcements.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnnouncementsComponent implements OnInit, AfterViewInit {
  private readonly service = inject(CommunicationService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly displayedColumns = ['title', 'categoryName', 'priority', 'authorName', 'publishOn', 'isRead', 'actions'];
  readonly dataSource = new MatTableDataSource<any>([]);
  readonly rowActions: RowAction[] = [
    { key: 'read', label: 'Mark as read', icon: 'mark_email_read', color: 'blue' },
    { key: 'delete', label: 'Delete', icon: 'delete', color: 'red' }
  ];

  filterTitle = '';
  filterCategory = '';

  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.refresh();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.sort.active = 'publishOn';
    this.sort.direction = 'desc';
    this.sort.sortChange.emit({ active: 'publishOn', direction: 'desc' });
  }

  refresh(): void {
    this.loading.set(true);
    this.service.getAnnouncements().subscribe({
      next: (res) => { this.dataSource.data = res.data?.items ?? []; this.applyFilter(); this.loading.set(false); },
      error: (err) => { this.notification.error('Load Failed', err?.message || 'Could not load announcements.'); this.loading.set(false); }
    });
  }

  applyFilter(): void {
    const title = this.filterTitle.toLowerCase().trim();
    const category = this.filterCategory.toLowerCase().trim();
    this.dataSource.filterPredicate = (row: any) => {
      const matchTitle = !title || (row.title ?? '').toLowerCase().includes(title);
      const matchCategory = !category || (row.categoryName ?? '').toLowerCase().includes(category);
      return matchTitle && matchCategory;
    };
    this.dataSource.filter = `${title}|${category}`;
  }

  onAction(key: string, row: any): void {
    switch (key) {
      case 'read': this.markRead(row); break;
      case 'delete': this.remove(row); break;
    }
  }

  markRead(row: any): void {
    if (!row?.contentId) return;
    this.service.markAnnouncementRead(row.contentId).subscribe({
      next: (res) => { this.notification.success('Marked Read', res?.message || 'Announcement marked as read.'); this.refresh(); },
      error: (err) => this.notification.error('Failed', err?.message || 'Could not mark as read.')
    });
  }

  openDialog(): void {
    const ref = this.dialog.open(AnnouncementDialogComponent, {
      width: '600px',
      data: { announcement: null }
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.refresh();
    });
  }

  remove(row: any): void {
    if (!row?.contentId) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Announcement',
        message: `Are you sure you want to delete "${row.title}"? This action cannot be undone.`,
        confirmText: 'Delete',
        color: 'warn'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.service.deleteAnnouncement(row.contentId).subscribe({
        next: (res) => { this.notification.success('Deleted', res?.message || 'Announcement removed.'); this.refresh(); },
        error: (err) => this.notification.error('Delete Failed', err?.message || 'Could not delete announcement.')
      });
    });
  }
}
