import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommunicationService } from '../../../core/services/communication.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { PostDialogComponent } from './post-dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

interface FeedComment {
  commentId?: number;
  author: string;
  authorPhotoUrl?: string | null;
  text: string;
  createdOn: Date | string;
  modifiedOn?: Date | string | null;
  createdBy?: number | null;
  canEdit: boolean;
  editing: boolean;
  editText: string;
}

interface FeedAttachment {
  attachmentId?: number;
  fileName: string;
  fileUrl: string;
  contentKind?: string | null;
  fileSizeBytes?: number;
}

type ContentType = 'Announcement' | 'Policy' | 'Post';
type FeedView = 'feed' | 'drafts' | 'archived';

interface ManagedItem {
  contentId: number;
  contentType: ContentType;
  title?: string | null;
  body?: string | null;
  kind?: string | null;
  categoryName?: string | null;
  isPinned?: boolean;
  authorName?: string | null;
  authorPhoto?: string | null;
  createdOn?: string | Date | null;
  images: string[];
  files: FeedAttachment[];
}

interface FeedPost {
  contentId: number;
  title?: string | null;
  body?: string | null;
  kind?: string | null;
  categoryName?: string | null;
  isPinned?: boolean;
  authorUserId?: number;
  authorName?: string | null;
  authorPhoto?: string | null;
  createdOn?: string | Date | null;
  images: string[];
  files: FeedAttachment[];
  // Engagement state from API
  liked: boolean;
  likeCount: number;
  commentCount: number;
  showComments: boolean;
  commentsLoaded: boolean;
  newComment: string;
  comments: FeedComment[];
}

@Component({
  selector: 'app-feed',
  imports: [
    FormsModule, DatePipe, MatButtonModule, MatButtonToggleModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatProgressBarModule, MatChipsModule, MatMenuModule, MatDialogModule
  ],
  templateUrl: './feed.html',
  styleUrl: './feed.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedComponent implements OnInit, OnDestroy {
  private readonly service = inject(CommunicationService);
  private readonly notification = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  private readonly currentUserId = this.auth.getUserId();

  @ViewChild('scrollSentinel') set scrollSentinel(ref: ElementRef<HTMLElement> | undefined) {
    this.observer ??= new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        this.loadMore();
      }
    }, { rootMargin: '200px' });
    this.observer.disconnect();
    if (ref) {
      this.observer.observe(ref.nativeElement);
    }
  }
  private observer?: IntersectionObserver;
  private readonly pageSize = 10;
  private pageNumber = 1;
  private totalPages = 1;

  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly hasMore = signal(false);
  readonly posts = signal<FeedPost[]>([]);
  readonly filterText = signal('');

  readonly view = signal<FeedView>('feed');
  readonly managedLoading = signal(false);
  readonly managedItems = signal<ManagedItem[]>([]);

  readonly visiblePosts = computed(() => {
    const q = this.filterText().toLowerCase().trim();
    if (!q) return this.posts();
    return this.posts().filter(p =>
      (p.title ?? '').toLowerCase().includes(q) ||
      (p.body ?? '').toLowerCase().includes(q) ||
      (p.categoryName ?? '').toLowerCase().includes(q)
    );
  });

  readonly visibleManaged = computed(() => {
    const q = this.filterText().toLowerCase().trim();
    if (!q) return this.managedItems();
    return this.managedItems().filter(i =>
      (i.title ?? '').toLowerCase().includes(q) ||
      (i.body ?? '').toLowerCase().includes(q) ||
      (i.categoryName ?? '').toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.refresh();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  refresh(): void {
    this.loading.set(true);
    this.pageNumber = 1;
    this.service.getPosts(this.pageNumber, this.pageSize).subscribe({
      next: (res) => {
        const data = res.data ?? {};
        const items = data.items ?? [];
        this.totalPages = Number(data.totalPages ?? 1) || 1;
        this.pageNumber = Number(data.pageNumber ?? 1) || 1;
        this.posts.set(items.map((it: any) => this.toFeedPost(it)));
        this.hasMore.set(this.pageNumber < this.totalPages);
        this.loading.set(false);
      },
      error: (err) => { this.notification.error('Load Failed', err?.message || 'Could not load posts.'); this.loading.set(false); }
    });
  }

  loadMore(): void {
    if (this.loadingMore() || this.loading() || !this.hasMore()) return;
    this.loadingMore.set(true);
    const next = this.pageNumber + 1;
    this.service.getPosts(next, this.pageSize).subscribe({
      next: (res) => {
        const data = res.data ?? {};
        const items = data.items ?? [];
        this.totalPages = Number(data.totalPages ?? this.totalPages) || this.totalPages;
        this.pageNumber = Number(data.pageNumber ?? next) || next;
        const mapped = items.map((it: any) => this.toFeedPost(it));
        this.posts.update(list => [...list, ...mapped]);
        this.hasMore.set(this.pageNumber < this.totalPages);
        this.loadingMore.set(false);
      },
      error: (err) => { this.notification.error('Load Failed', err?.message || 'Could not load more posts.'); this.loadingMore.set(false); }
    });
  }

  onFilter(value: string): void {
    this.filterText.set(value);
  }

  setView(view: FeedView): void {
    if (this.view() === view) return;
    this.view.set(view);
    if (view === 'feed') return;
    this.loadManaged(view);
  }

  private loadManaged(view: Exclude<FeedView, 'feed'>): void {
    this.managedLoading.set(true);
    this.managedItems.set([]);
    const empty = of({ data: { items: [] } });
    const size = 20;

    const announcements$ = (view === 'drafts'
      ? this.service.getDraftAnnouncements(1, size)
      : this.service.getArchivedAnnouncements(1, size)).pipe(catchError(() => empty));
    const policies$ = (view === 'drafts'
      ? this.service.getDraftPolicies(1, size)
      : this.service.getArchivedPolicies(1, size)).pipe(catchError(() => empty));
    const posts$ = (view === 'drafts'
      ? this.service.getDraftPosts(1, size)
      : this.service.getArchivedPosts(1, size)).pipe(catchError(() => empty));

    forkJoin({ announcements: announcements$, policies: policies$, posts: posts$ }).subscribe({
      next: (res) => {
        if (this.view() !== view) return;
        const merged: ManagedItem[] = [
          ...this.mapManaged(res.announcements?.data?.items, 'Announcement'),
          ...this.mapManaged(res.policies?.data?.items, 'Policy'),
          ...this.mapManaged(res.posts?.data?.items, 'Post')
        ].sort((a, b) => {
          if (!!a.isPinned !== !!b.isPinned) return a.isPinned ? -1 : 1;
          return new Date(b.createdOn ?? 0).getTime() - new Date(a.createdOn ?? 0).getTime();
        });
        this.managedItems.set(merged);
        this.managedLoading.set(false);
      },
      error: (err) => { this.notification.error('Load Failed', err?.message || 'Could not load content.'); this.managedLoading.set(false); }
    });
  }

  private mapManaged(items: any[] | undefined, contentType: ContentType): ManagedItem[] {
    if (!Array.isArray(items)) return [];
    return items.map((it: any) => {
      const { images, files } = this.splitAttachments(it);
      return {
        contentId: it.contentId,
        contentType,
        title: it.title ?? null,
        body: it.body ?? null,
        kind: it.kind ?? null,
        categoryName: it.categoryName ?? null,
        isPinned: !!it.isPinned,
        authorName: it.authorName ?? null,
        authorPhoto: it.authorPhoto ?? null,
        createdOn: it.createdOn ?? null,
        images,
        files
      };
    });
  }

  managedInitials(item: ManagedItem): string {
    const name = (item.authorName || '').trim();
    if (name) {
      const parts = name.split(/\s+/);
      return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
    }
    return 'U';
  }

  private splitAttachments(it: any): { images: string[]; files: FeedAttachment[] } {
    const attachments: any[] = Array.isArray(it?.attachments) ? it.attachments : [];
    const images: string[] = [];
    const files: FeedAttachment[] = [];
    for (const a of attachments) {
      const url = a?.fileUrl ?? a?.url;
      if (!url) continue;
      if (this.isImage(a)) {
        images.push(url);
      } else {
        files.push({
          attachmentId: a.attachmentId,
          fileName: a.fileName ?? 'Attachment',
          fileUrl: url,
          contentKind: a.contentKind ?? null,
          fileSizeBytes: a.fileSizeBytes != null ? Number(a.fileSizeBytes) : undefined
        });
      }
    }
    return { images, files };
  }

  private toFeedPost(it: any): FeedPost {
    const { images, files } = this.splitAttachments(it);
    return {
      ...it,
      images,
      files,
      liked: !!it.iLiked,
      likeCount: it.likeCount ?? 0,
      commentCount: it.commentCount ?? 0,
      showComments: false,
      commentsLoaded: false,
      newComment: '',
      comments: []
    };
  }

  private isImage(a: any): boolean {
    const kind = String(a?.contentKind ?? '').toLowerCase();
    if (kind.includes('image')) return true;
    const src = String(a?.fileName ?? a?.fileUrl ?? '').toLowerCase();
    return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/.test(src);
  }

  fileSizeLabel(bytes?: number): string {
    if (!bytes || bytes <= 0) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let n = bytes;
    let i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
  }

  authorInitials(post: FeedPost): string {
    const name = (post.authorName || '').trim();
    if (name) {
      const parts = name.split(/\s+/);
      return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
    }
    return 'U';
  }

  toggleLike(post: FeedPost): void {
    this.service.togglePostLike(post.contentId).subscribe({
      next: (res) => {
        const state = res?.data ?? {};
        this.posts.update(list => list.map(p =>
          p.contentId === post.contentId
            ? { ...p, liked: !!state.isEngaged, likeCount: state.count ?? p.likeCount }
            : p
        ));
      },
      error: (err) => this.notification.error('Failed', err?.message || 'Could not update reaction.')
    });
  }

  toggleComments(post: FeedPost): void {
    this.posts.update(list => list.map(p =>
      p.contentId === post.contentId ? { ...p, showComments: !p.showComments } : p
    ));
    if (!post.showComments && !post.commentsLoaded) {
      this.loadComments(post);
    }
  }

  private loadComments(post: FeedPost): void {
    this.service.getComments(post.contentId).subscribe({
      next: (res) => {
        const comments = (res?.data ?? []).map((c: any) => this.toFeedComment(c));
        this.posts.update(list => list.map(p =>
          p.contentId === post.contentId ? { ...p, comments, commentsLoaded: true } : p
        ));
      },
      error: (err) => this.notification.error('Failed', err?.message || 'Could not load comments.')
    });
  }

  private toFeedComment(c: any): FeedComment {
    const createdBy = c.createdBy != null ? Number(c.createdBy) : null;
    return {
      commentId: c.commentId,
      author: c.authorName || 'User',
      authorPhotoUrl: c.authorPhotoUrl ?? null,
      text: c.body ?? '',
      createdOn: c.createdOn ?? new Date(),
      modifiedOn: c.modifiedOn ?? null,
      createdBy,
      canEdit: this.currentUserId != null && createdBy != null && createdBy === this.currentUserId,
      editing: false,
      editText: ''
    };
  }

  commentTimeLabel(comment: FeedComment): string {
    const edited = !!comment.modifiedOn;
    const ts = edited ? comment.modifiedOn! : comment.createdOn;
    return `${edited ? 'edited' : 'commented'} ${this.timeAgo(ts)}`;
  }

  private timeAgo(value: Date | string | null | undefined): string {
    if (!value) return '';
    const then = new Date(value).getTime();
    if (isNaN(then)) return '';
    const seconds = Math.floor((Date.now() - then) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds} sec${seconds === 1 ? '' : 's'} ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
    const years = Math.floor(days / 365);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  }

  private updateComment(post: FeedPost, commentId: number | undefined, change: Partial<FeedComment>): void {
    this.posts.update(list => list.map(p => {
      if (p.contentId !== post.contentId) return p;
      return {
        ...p,
        comments: p.comments.map(c => c.commentId === commentId ? { ...c, ...change } : c)
      };
    }));
  }

  startEditComment(post: FeedPost, comment: FeedComment): void {
    this.updateComment(post, comment.commentId, { editing: true, editText: comment.text });
  }

  cancelEditComment(post: FeedPost, comment: FeedComment): void {
    this.updateComment(post, comment.commentId, { editing: false, editText: '' });
  }

  updateCommentDraft(post: FeedPost, comment: FeedComment, value: string): void {
    this.updateComment(post, comment.commentId, { editText: value });
  }

  saveEditComment(post: FeedPost, comment: FeedComment): void {
    const text = comment.editText.trim();
    if (!comment.commentId || !text) return;
    if (text === comment.text) {
      this.updateComment(post, comment.commentId, { editing: false, editText: '' });
      return;
    }
    this.service.updateComment(comment.commentId, text).subscribe({
      next: (res) => {
        const data = res?.data ?? {};
        const body = data.body ?? text;
        this.updateComment(post, comment.commentId, {
          text: body,
          modifiedOn: data.modifiedOn ?? new Date().toISOString(),
          editing: false,
          editText: ''
        });
      },
      error: (err) => this.notification.error('Failed', err?.message || 'Could not update comment.')
    });
  }

  deleteComment(post: FeedPost, comment: FeedComment): void {
    if (!comment.commentId) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Comment',
        message: 'Are you sure you want to delete this comment?',
        confirmText: 'Delete',
        color: 'warn'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.service.deleteComment(comment.commentId!).subscribe({
        next: () => {
          this.posts.update(list => list.map(p => {
            if (p.contentId !== post.contentId) return p;
            return {
              ...p,
              commentCount: Math.max(0, p.commentCount - 1),
              comments: p.comments.filter(c => c.commentId !== comment.commentId)
            };
          }));
        },
        error: (err) => this.notification.error('Failed', err?.message || 'Could not delete comment.')
      });
    });
  }

  updateDraft(post: FeedPost, value: string): void {
    this.posts.update(list => list.map(p =>
      p.contentId === post.contentId ? { ...p, newComment: value } : p
    ));
  }

  addComment(post: FeedPost): void {
    const text = post.newComment.trim();
    if (!text) return;
    this.service.addComment(post.contentId, text).subscribe({
      next: (res) => {
        const comment = this.toFeedComment(res?.data ?? { body: text, authorName: 'You', createdOn: new Date() });
        this.posts.update(list => list.map(p => {
          if (p.contentId !== post.contentId) return p;
          return {
            ...p,
            newComment: '',
            commentCount: p.commentCount + 1,
            comments: [...p.comments, comment]
          };
        }));
      },
      error: (err) => this.notification.error('Failed', err?.message || 'Could not post comment.')
    });
  }

  openDialog(): void {
    const ref = this.dialog.open(PostDialogComponent, {
      width: '600px',
      data: { post: null }
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.refresh();
    });
  }

  remove(post: FeedPost): void {
    if (!post?.contentId) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Post',
        message: `Are you sure you want to delete this post? This action cannot be undone.`,
        confirmText: 'Delete',
        color: 'warn'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.service.deletePost(post.contentId).subscribe({
        next: (res) => { this.notification.success('Deleted', res?.message || 'Post removed.'); this.refresh(); },
        error: (err) => this.notification.error('Delete Failed', err?.message || 'Could not delete post.')
      });
    });
  }
}
