// src/components/auth/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission?: string | string[];
    requiredRole?: string | string[];
    requireAll?: boolean;
    redirectTo?: string;
    unauthorizedUrl?: string;
}

export const ProtectedRoute = ({
    children,
    requiredPermission,
    requiredRole,
    requireAll = false,
    redirectTo = '/login',
    unauthorizedUrl = '/unauthorized',
}: ProtectedRouteProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isLoading, _hasHydrated } = useAuthStore();
    const { can } = usePermissions();

    const isReady = _hasHydrated && !isLoading;

    const isAuthorized = can({
        permission: requiredPermission,
        role: requiredRole,
        requireAll,
    });

    useEffect(() => {
        if (!isReady) return;

        if (!isAuthenticated) {
            const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(pathname)}`;
            router.push(loginUrl);
            return;
        }

        if (!isAuthorized) {
            router.push(unauthorizedUrl);
        }
    }, [
        isReady,
        isAuthenticated,
        isAuthorized,
        router,
        redirectTo,
        unauthorizedUrl,
        pathname,
    ]);

    if (!isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
        );
    }

    if (!isAuthenticated || !isAuthorized) {
        return null;
    }

    return <>{children}</>;
};

export default ProtectedRoute;