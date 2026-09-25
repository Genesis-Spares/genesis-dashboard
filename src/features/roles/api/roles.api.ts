// src/features/roles/api/roles.api.ts
import { apiClient } from '@/lib/api/client';
import {
    Role,
    CreateRolePayload,
    UpdateRolePayload,
    PermissionCatalog,
} from '@/types/user-management.types';

export const rolesApi = {
    list: async (): Promise<Role[]> => {
        const data = await apiClient.get<Role[]>('/roles');
        return data;
    },

    get: async (id: string): Promise<Role> => {
        const data = await apiClient.get<Role>(`/roles/${id}`);
        return data;
    },

    create: async (input: CreateRolePayload): Promise<Role> => {
        const data = await apiClient.post<Role>('/roles', input);
        return data;
    },

    update: async (id: string, input: UpdateRolePayload): Promise<Role> => {
        const data = await apiClient.put<Role>(`/roles/${id}`, input);
        return data;
    },

    remove: async (id: string): Promise<void> => {
        await apiClient.delete(`/roles/${id}`);
    },

    assignPermissions: async (id: string, permissionIds: string[]): Promise<Role> => {
        const data = await apiClient.put<Role>(`/roles/${id}/permissions`, { permissionIds });
        return data;
    },

    getPermissionCatalog: async (): Promise<PermissionCatalog> => {
        const data = await apiClient.get<PermissionCatalog>('/roles/permissions/catalog');
        return data;
    },
};
