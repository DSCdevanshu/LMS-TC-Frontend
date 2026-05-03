import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ApiResponse } from '../../data/models/api-response.model';

export const responseInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        const body = event.body as ApiResponse<unknown>;

        if (body && body.status === 0) {
          console.error('API Business Error:', body.message);
          throw new Error(body.message ?? 'Business logic failure');
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error:', error.message);
      return throwError(() => error);
    })
  );
};
