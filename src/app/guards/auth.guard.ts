import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);

    // Leer DIRECTAMENTE de localStorage - sin AuthService, sin signals
    const token = localStorage.getItem('festeasy_token');

    if (token) {
        console.log('AuthGuard: Token found, access granted');
        return true;
    }

    console.log('AuthGuard: No token found, redirecting to login');
    router.navigate(['/login']);
    return false;
};
