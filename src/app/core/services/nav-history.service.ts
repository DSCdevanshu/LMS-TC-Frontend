import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface NavEntry {
  url: string;
  title: string;
}

@Injectable({ providedIn: 'root' })
export class NavHistoryService {
  private readonly router = inject(Router);
  private readonly _stack = signal<NavEntry[]>([]);
  private readonly maxSize = 10;
  private isPopstate = false;

  readonly stack = this._stack.asReadonly();

  init(): void {
    // Track whether navigation was triggered by browser back/forward
    this.router.events.pipe(filter(e => e instanceof NavigationStart)).subscribe((e: any) => {
      this.isPopstate = e.navigationTrigger === 'popstate';
    });

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      const url: string = (e.urlAfterRedirects || e.url).split('?')[0];
      if (url === '/login') { this._stack.set([]); return; }

      // Use routerState for reliable route data resolution with lazy-loaded components
      let route = this.router.routerState.root.snapshot;
      while (route.firstChild) route = route.firstChild;
      const title = (route.data['title'] as string) || this.fallbackTitle(url);

      if (this.isPopstate) {
        // Browser back/forward — find the entry and trim to it, or pop last
        this._stack.update(stack => {
          const idx = stack.findIndex(s => s.url === url);
          if (idx >= 0) return stack.slice(0, idx + 1);
          return stack.length > 1 ? stack.slice(0, -1) : stack;
        });
      } else {
        // Imperative navigation — push new entry or trim to existing
        this._stack.update(stack => {
          const idx = stack.findIndex(s => s.url === url);
          if (idx >= 0) return stack.slice(0, idx + 1);
          const next = [...stack, { url, title }];
          return next.length > this.maxSize ? next.slice(next.length - this.maxSize) : next;
        });
      }
    });
  }

  navigateTo(entry: NavEntry): void {
    // trim stack up to this entry, then navigate
    this._stack.update(stack => {
      const idx = stack.findIndex(s => s.url === entry.url);
      return idx >= 0 ? stack.slice(0, idx + 1) : stack;
    });
    void this.router.navigateByUrl(entry.url);
  }

  goBack(): void {
    const stack = this._stack();
    if (stack.length >= 2) {
      const target = stack[stack.length - 2];
      this.navigateTo(target);
    } else {
      // No prior history — use browser back
      history.back();
    }
  }

  reset(): void {
    this._stack.set([]);
  }

  private fallbackTitle(url: string): string {
    const last = url.split('/').filter(Boolean).pop() || 'Page';
    return last.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
