import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';

export interface AudienceTarget {
  TargetType: string;
  TargetId: number | null;
}

export interface CreateContentPayload {
  title?: string | null;
  body?: string | null;
  categoryId?: number | null;
  kind?: string | null;
  priority?: string | null;
  isPinned?: boolean;
  publishOn?: string | null;
  expiresOn?: string | null;
  status?: string | null;
  ownerDepartmentId?: number | null;
  audience?: AudienceTarget[] | null;
  attachments?: File[] | null;
}

@Injectable({ providedIn: 'root' })
export class CommunicationService extends BaseService {
  private paging(pageNumber: number, pageSize: number): HttpParams {
    return new HttpParams().set('pageNumber', pageNumber).set('pageSize', pageSize);
  }

  /** Builds a multipart FormData body for the create-content endpoints. */
  private buildContentForm(p: CreateContentPayload): FormData {
    const fd = new FormData();
    const append = (key: string, val: unknown) => {
      if (val !== null && val !== undefined && val !== '') fd.append(key, String(val));
    };
    append('Title', p.title);
    append('Body', p.body);
    append('CategoryId', p.categoryId);
    append('Kind', p.kind);
    append('Priority', p.priority);
    if (p.isPinned !== undefined) fd.append('IsPinned', String(!!p.isPinned));
    append('PublishOn', p.publishOn);
    append('ExpiresOn', p.expiresOn);
    append('Status', p.status);
    append('OwnerDepartmentId', p.ownerDepartmentId);

    // Complex list binds via indexed form keys: Audience[i].TargetType / .TargetId
    (p.audience ?? []).forEach((a, i) => {
      fd.append(`Audience[${i}].TargetType`, a.TargetType);
      if (a.TargetId !== null && a.TargetId !== undefined) {
        fd.append(`Audience[${i}].TargetId`, String(a.TargetId));
      }
    });

    (p.attachments ?? []).forEach(file => fd.append('Attachments', file));
    return fd;
  }

  private buildFilesForm(files: File[]): FormData {
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    return fd;
  }

  // ---- Announcements ----
  getAnnouncements(pageNumber = 1, pageSize = 20): Observable<any> {
    return this.get('Communications/Announcement', this.paging(pageNumber, pageSize));
  }
  createAnnouncement(payload: CreateContentPayload): Observable<any> {
    return this.post('Communications/Announcement', this.buildContentForm(payload));
  }
  deleteAnnouncement(id: number): Observable<any> { return this.delete(`Communications/Announcement/${id}`); }
  addAnnouncementAttachments(id: number, files: File[]): Observable<any> {
    return this.post(`Communications/Announcement/${id}/Attachment`, this.buildFilesForm(files));
  }
  markAnnouncementRead(id: number): Observable<any> {
    return this.post(`Communications/Announcement/${id}/Read`, null);
  }

  // ---- Policies ----
  getPolicies(pageNumber = 1, pageSize = 20): Observable<any> {
    return this.get('Communications/Policy', this.paging(pageNumber, pageSize));
  }
  createPolicy(payload: CreateContentPayload): Observable<any> {
    return this.post('Communications/Policy', this.buildContentForm(payload));
  }
  deletePolicy(id: number): Observable<any> { return this.delete(`Communications/Policy/${id}`); }
  addPolicyAttachments(id: number, files: File[]): Observable<any> {
    return this.post(`Communications/Policy/${id}/Attachment`, this.buildFilesForm(files));
  }
  acknowledgePolicy(id: number): Observable<any> {
    return this.post(`Communications/Policy/${id}/Acknowledge`, null);
  }

  // ---- Posts (Feed) ----
  getPosts(pageNumber = 1, pageSize = 20): Observable<any> {
    return this.get('Communications/Post', this.paging(pageNumber, pageSize));
  }
  createPost(payload: CreateContentPayload): Observable<any> {
    return this.post('Communications/Post', this.buildContentForm(payload));
  }
  deletePost(id: number): Observable<any> { return this.delete(`Communications/Post/${id}`); }
  getDraftPosts(pageNumber = 1, pageSize = 10): Observable<any> {
    return this.get('Communications/Post/Drafts', this.paging(pageNumber, pageSize));
  }
  getArchivedPosts(pageNumber = 1, pageSize = 10): Observable<any> {
    return this.get('Communications/Post/Archived', this.paging(pageNumber, pageSize));
  }
  getDraftAnnouncements(pageNumber = 1, pageSize = 10): Observable<any> {
    return this.get('Communications/Announcement/Drafts', this.paging(pageNumber, pageSize));
  }
  getArchivedAnnouncements(pageNumber = 1, pageSize = 10): Observable<any> {
    return this.get('Communications/Announcement/Archived', this.paging(pageNumber, pageSize));
  }
  getDraftPolicies(pageNumber = 1, pageSize = 10): Observable<any> {
    return this.get('Communications/Policy/Drafts', this.paging(pageNumber, pageSize));
  }
  getArchivedPolicies(pageNumber = 1, pageSize = 10): Observable<any> {
    return this.get('Communications/Policy/Archived', this.paging(pageNumber, pageSize));
  }
  addPostAttachments(id: number, files: File[]): Observable<any> {
    return this.post(`Communications/Post/${id}/Attachment`, this.buildFilesForm(files));
  }
  togglePostLike(id: number): Observable<any> {
    return this.post(`Communications/Post/${id}/Like`, null);
  }

  // ---- Content (shared: detail, comments) ----
  getContentDetail(id: number): Observable<any> { return this.get(`Communications/Content/${id}`); }
  getComments(contentId: number): Observable<any> { return this.get(`Communications/Content/${contentId}/Comments`); }
  addComment(contentId: number, body: string, parentCommentId?: number | null): Observable<any> {
    return this.post(`Communications/Content/${contentId}/Comment`, { body, parentCommentId: parentCommentId ?? null });
  }
  updateComment(commentId: number, body: string): Observable<any> {
    return this.put(`Communications/Comment/${commentId}`, { body });
  }
  deleteComment(commentId: number): Observable<any> { return this.delete(`Communications/Comment/${commentId}`); }

  // ---- Attachments ----
  deleteAttachment(attachmentId: number): Observable<any> {
    return this.delete(`Communications/Attachment/${attachmentId}`);
  }
}
