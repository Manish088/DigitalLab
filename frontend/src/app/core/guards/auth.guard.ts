import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isSuperAdmin()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

export const subscriptionActiveGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const apiService = inject(ApiService);
  const toast = inject(ToastService);
  const router = inject(Router);

  // Super admins have unrestricted access
  if (authService.isSuperAdmin()) {
    return true;
  }

  return apiService.getMySubscription().pipe(
    map((sub: any) => {
      const isPastDate = sub?.subscriptionExpiryDate ? new Date(sub.subscriptionExpiryDate) < new Date() : false;
      const isExpired = sub?.isExpired || sub?.subscriptionStatus === 'Expired' || sub?.subscriptionStatus === 'Suspended' || isPastDate;

      if (isExpired) {
        const expDateStr = sub?.subscriptionExpiryDate 
          ? new Date(sub.subscriptionExpiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
          : 'earlier';
        
        toast.error(`⚠️ Laboratory Subscription Expired (Ended on ${expDateStr}). Please renew your plan to register new patients and generate bills.`);
        router.navigate(['/subscription']);
        return false;
      }
      return true;
    }),
    catchError(() => {
      return of(true);
    })
  );
};

// Launch Day Gate: Shows /launch today by default, then runs normally on /home next day onwards
export const launchGateGuard: CanActivateFn = () => {
  const router = inject(Router);

  const todayStr = new Date().toISOString().split('T')[0];
  const launchDateStr = localStorage.getItem('digitlab_launch_date');
  const isSiteLaunched = localStorage.getItem('digitlab_site_launched') === 'true';

  // 1. If already launched on a previous day (next day onwards), run simply without launch screen
  if (isSiteLaunched && launchDateStr && launchDateStr < todayStr) {
    router.navigate(['/home']);
    return false;
  }

  // 2. For today (Launch Day): By default show /launch screen!
  router.navigate(['/launch']);
  return false;
};

