import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const currentUser = authService.currentUserSignal();

  let headers = req.headers;
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  if (currentUser?.tenantId) {
    headers = headers.set('X-Tenant-Id', currentUser.tenantId);
  }

  // Real-Time Enforcement: Prevent browser/network disk caching
  headers = headers
    .set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
    .set('Pragma', 'no-cache')
    .set('Expires', '0');

  const clonedReq = req.clone({ headers });
  return next(clonedReq);
};
