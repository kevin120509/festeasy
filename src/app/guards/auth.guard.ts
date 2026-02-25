import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
    const router = inject(Router);
    const auth = inject(AuthService);

    const isAuthenticated = await auth.waitForAuth();

    if (isAuthenticated) {
        // console.log('AuthGuard: Access granted');
        return true;
    }

    console.log('AuthGuard: Not logged in, redirecting to login');
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
};
