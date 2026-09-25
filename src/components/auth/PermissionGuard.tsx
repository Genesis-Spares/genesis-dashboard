// src/components/auth/PermissionGuard.tsx
'use client';

import React, { ReactNode } from 'react';
import { usePermissions } from '@/lib/hooks/usePermissions';

export interface PermissionGuardProps {
    /** Single permission string or array of required permissions */
    permission?: string | string[];
    /** Single role string or array of required roles */
    role?: string | string[];
    /** If true, requires all permissions/roles instead of any. Defaults to false. */
    requireAll?: boolean;
    /** Content to render if permission check fails. Defaults to null. */
    fallback?: ReactNode;
    children: ReactNode;
}

/**
 * Conditionally renders children if the authenticated user satisfies the required permission(s) or role(s).
 *
 * Example usage:
 * ```tsx
 * <PermissionGuard permission="user:create">
 *   <button>Create User</button>
 * </PermissionGuard>
 * 
 * <Can permission={["category:update", "category:delete"]} requireAll>
 *   <CategoryActions />
 * </Can>
 * ```
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    permission,
    role,
    requireAll = false,
    fallback = null,
    children,
}) => {
    const { can } = usePermissions();

    const isAllowed = can({
        permission,
        role,
        requireAll,
    });

    if (!isAllowed) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

/** Shortcut alias for PermissionGuard */
export const Can = PermissionGuard;

export default PermissionGuard;
