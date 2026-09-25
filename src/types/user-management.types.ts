// src/types/user-management.types.ts
// Types for the admin "Users" and "Roles & Permissions" screens. Distinct
// from src/types/auth.types.ts's `User` (the currently-logged-in JWT user).

export interface RoleRef {
    id: string;
    name: string;
    description?: string | null;
}

// Richer account lifecycle than isActive alone — PENDING means the admin
// created the account but the invite hasn't been accepted yet.
export const ACCOUNT_STATUSES = ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export interface ManagedUser {
    id: string;
    email: string;
    firstname: string;
    lastName: string;
    phone?: string | null;
    isActive: boolean;
    isEmailVerified: boolean;
    status: AccountStatus;
    createAt: string;
    updateAt: string;
    roles: RoleRef[];
}

export interface UserListParams {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    roleId?: string;
    sortBy?: 'createAt' | 'updateAt' | 'email' | 'firstname' | 'lastName';
    sortOrder?: 'asc' | 'desc';
}

export interface UserListResponse {
    data: ManagedUser[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface CreateUserPayload {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roleIds?: string[];
    isActive?: boolean;
}

export interface UpdateUserPayload {
    firstName?: string;
    lastName?: string;
    phone?: string;
    isActive?: boolean;
    status?: AccountStatus;
    isEmailVerified?: boolean;
}

// Self-service "My Profile" edit — deliberately narrower than
// UpdateUserPayload: no isActive, since a user can't deactivate themselves.
export interface UpdateProfilePayload {
    firstName?: string;
    lastName?: string;
    phone?: string;
}

export interface UserStats {
    total: number;
    active: number;
    inactive: number;
    verified: number;
    newLast30Days: number;
    byRole: { roleId: string; roleName: string; count: number }[];
}

export interface UserActivityEntry {
    id: string;
    action: string;
    resource?: string;
    resourceId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
}

export interface UserActivityResponse {
    data: UserActivityEntry[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface Permission {
    id: string;
    resource: string;
    action: string;
}

export interface PermissionGroup {
    resource: string;
    permissions: Permission[];
}

export interface PermissionCatalog {
    permissions: Permission[];
    grouped: PermissionGroup[];
}

export interface Role {
    id: string;
    name: string;
    description?: string | null;
    isSystem: boolean;
    createAt: string;
    permissions: Permission[];
    userCount?: number;
    users?: { id: string; email: string; firstname: string; lastName: string; isActive?: boolean }[];
}

export interface CreateRolePayload {
    name: string;
    description?: string;
    permissionIds?: string[];
}

export interface UpdateRolePayload {
    name?: string;
    description?: string;
}
