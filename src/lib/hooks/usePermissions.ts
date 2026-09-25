// src/lib/hooks/usePermissions.ts
import { useAuthStore } from '@/lib/stores/authStore';

/**
 * Checks if a user permission string matches a target permission.
 * Supports exact match, full wildcards ('*', '*:*'), and domain wildcards ('user:*', 'category.*').
 */
export const matchPermission = (userPerm: string, targetPerm: string): boolean => {
    if (userPerm === targetPerm || userPerm === '*' || userPerm === '*:*') {
        return true;
    }
    if (userPerm.endsWith(':*')) {
        const prefix = userPerm.slice(0, -1);
        return targetPerm.startsWith(prefix);
    }
    if (userPerm.endsWith('.*')) {
        const prefix = userPerm.slice(0, -1);
        return targetPerm.startsWith(prefix);
    }
    return false;
};

export interface CanOptions {
    permission?: string | string[];
    role?: string | string[];
    requireAll?: boolean;
}

export const usePermissions = () => {
    const { user } = useAuthStore();
    const userRoles = user?.roles ?? [];
    const userPermissions = user?.permissions ?? [];

    const isBypassed = (): boolean => {
        if (!user) return false;
        return userRoles.includes('super_admin') || userRoles.includes('admin');
    };

    const hasPermission = (permission: string): boolean => {
        if (!user) return false;
        if (isBypassed()) return true;
        return userPermissions.some((userPerm) => matchPermission(userPerm, permission));
    };

    const hasAnyPermission = (permissions: string[]): boolean => {
        if (!user) return false;
        if (permissions.length === 0) return true;
        if (isBypassed()) return true;
        return permissions.some((perm) => hasPermission(perm));
    };

    const hasAllPermissions = (permissions: string[]): boolean => {
        if (!user) return false;
        if (permissions.length === 0) return true;
        if (isBypassed()) return true;
        return permissions.every((perm) => hasPermission(perm));
    };

    const hasRole = (role: string): boolean => {
        if (!user) return false;
        if (userRoles.includes('super_admin')) return true;
        return userRoles.includes(role);
    };

    const hasAnyRole = (roles: string[]): boolean => {
        if (!user) return false;
        if (roles.length === 0) return true;
        if (userRoles.includes('super_admin')) return true;
        return roles.some((role) => userRoles.includes(role));
    };

    const hasAllRoles = (roles: string[]): boolean => {
        if (!user) return false;
        if (roles.length === 0) return true;
        if (userRoles.includes('super_admin')) return true;
        return roles.every((role) => userRoles.includes(role));
    };

    const can = (options: CanOptions): boolean => {
        if (!user) return false;
        const { permission, role, requireAll = false } = options;

        let permAllowed = true;
        if (permission) {
            const permList = Array.isArray(permission) ? permission : [permission];
            permAllowed = requireAll ? hasAllPermissions(permList) : hasAnyPermission(permList);
        }

        let roleAllowed = true;
        if (role) {
            const roleList = Array.isArray(role) ? role : [role];
            roleAllowed = requireAll ? hasAllRoles(roleList) : hasAnyRole(roleList);
        }

        return permAllowed && roleAllowed;
    };

    return {
        user,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        hasAnyRole,
        hasAllRoles,
        can,
        permissions: userPermissions,
        roles: userRoles,
    };
};