import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = async (route, state) => {
    const router = inject(Router);
    const auth = inject(AuthService);

    // Esperar a que la autenticación se inicialice
    const isAuthenticated = await auth.waitForAuth();

    if (!isAuthenticated) {
        console.log('RoleGuard: Not logged in, redirecting to login');
        router.navigate(['/login']);
        return false;
    }

    const user = auth.currentUser();
    // Obtener el rol requerido desde los datos de la ruta
    const requiredRole = route.data['role'] as string;

    if (!user || !user.rol) {
        console.log('RoleGuard: No role found, redirecting to login');
        router.navigate(['/login']);
        return false;
    }

    // Verificar si el rol del usuario coincide con el requerido
    if (user.rol === requiredRole) {
        // console.log(`RoleGuard: Access granted for role ${requiredRole}`);
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
