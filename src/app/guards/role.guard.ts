import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const roleGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);

    // Leer DIRECTAMENTE de localStorage - sin AuthService, sin signals
    const token = localStorage.getItem('festeasy_token');
    const userStr = localStorage.getItem('festeasy_user');

    if (!token || !userStr) {
        console.log('RoleGuard: No token or user, redirecting to login');
        router.navigate(['/login']);
        return false;
    }

    let user;
    try {
        user = JSON.parse(userStr);
    } catch (e) {
        console.error('RoleGuard: Error parsing user:', e);
        router.navigate(['/login']);
        return false;
    }

    // Obtener el rol requerido desde los datos de la ruta
    const requiredRole = route.data['role'] as string;

    if (!user || !user.rol) {
        console.log('RoleGuard: No role found, redirecting to login');
        router.navigate(['/login']);
        return false;
    }

    // Verificar si el rol del usuario coincide con el requerido
    if (user.rol === requiredRole) {
        console.log(`RoleGuard: Access granted for role ${requiredRole}`);
        return true;
    }

    // Si el usuario tiene un rol diferente, redirigir a su dashboard correcto
    console.log(`RoleGuard: Role mismatch (${user.rol} vs ${requiredRole}), redirecting`);
    if (user.rol === 'client') {
        router.navigate(['/cliente/dashboard']);
    } else if (user.rol === 'provider') {
        router.navigate(['/proveedor/dashboard']);
    } else {
        router.navigate(['/login']);
    }

    return false;
};
