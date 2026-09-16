import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/user.model';

export function roleGuard(allowedRole: Role): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isAuthenticated()) {
      router.navigate(['/auth/login']);
      return false;
    }
    if (auth.currentUser()?.role !== allowedRole) {
      router.navigate(['/']);
      return false;
    }
    return true;
  };
}
