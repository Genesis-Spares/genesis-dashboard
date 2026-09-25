// src/lib/hooks/useAuth.ts
import { useAuthStore } from '@/lib/stores/authStore';
import { usePermissions } from './usePermissions';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
    const router = useRouter();
    const {
        user,
        tokens,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        refreshToken,
        fetchUser,
        clearError,
    } = useAuthStore();

    const { hasPermission, hasRole, hasAnyPermission, hasAnyRole } = usePermissions();

    const redirectToLogin = () => {
        router.push('/login');
    };

    const redirectToDashboard = () => {
        router.push('/dashboard');
    };

    return {
        // Auth state
        user,
        tokens,
        isAuthenticated,
        isLoading,
        error,

        // Auth actions
        login,
        logout,
        refreshToken,
        fetchUser,
        clearError,

        // Permissions
        hasPermission,
        hasRole,
        hasAnyPermission,
        hasAnyRole,

        // Navigation helpers
        redirectToLogin,
        redirectToDashboard,
    };
};