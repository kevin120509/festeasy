import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SupabaseDataService } from '../services/supabase-data.service';

export const webBuilderGuard: CanActivateFn = async (route, state) => {
    const auth = inject(AuthService);
    const supabaseData = inject(SupabaseDataService);
    const router = inject(Router);

    const user = auth.currentUser();
    if (!user || user.rol !== 'provider') {
        router.navigate(['/login']);
        return false;
    }

    try {
        const activeAddons = await supabaseData.getProviderAddonsCodes(user.id);
        const hasWebBuilder = activeAddons.includes('WEB_BUILDER') || activeAddons.includes('website');

        if (hasWebBuilder) {
            return true;
        } else {
            // Redirect to configuration or a dedicated "Buy Addon" page
            router.navigate(['/proveedor/configuracion'], {
                queryParams: { addonRequired: 'WEB_BUILDER' }
            });
            return false;
        }
    } catch (error) {
        console.error('Error in WebBuilderGuard:', error);
        router.navigate(['/proveedor/dashboard']);
        return false;
    }
};
