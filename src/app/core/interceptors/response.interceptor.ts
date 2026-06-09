import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const responseInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        const body = event.body as any;

        if (body && body.status === 0) {
          console.error('API Business Error:', body.message);
          throw { apiError: true, message: body.message ?? 'Something went wrong' };
        }
      }
    }),
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authService.logout();
        void router.navigate(['/login']);
      }
      // Extract message: API business error, HTTP error body, or generic
      const msg = error?.message
        || error?.error?.message
        || 'Something went wrong';
      console.error('HTTP Error:', msg);
      return throwError(() => ({ message: msg, status: error?.status }));
    })
  );
};
