// src/features/users/api/users.api.ts
import { apiClient } from '@/lib/api/client';
import {
    ManagedUser,
    UserListParams,
    UserListResponse,
    CreateUserPayload,
    UpdateUserPayload,
    UpdateProfilePayload,
    UserStats,
    UserActivityResponse,
} from '@/types/user-management.types';

export const usersApi = {
    // Self-service: the current user's own record, via the auth-service DB
    // (not just the JWT claims /me returns), so firstName/lastName/phone
    // are accurate even though the JWT payload itself omits them.
    getMyProfile: async (): Promise<ManagedUser> => {
        const data = await apiClient.get<ManagedUser>('/users/me/profile');
        return data;
    },

    updateMyProfile: async (input: UpdateProfilePayload): Promise<ManagedUser> => {
        const data = await apiClient.patch<ManagedUser>('/users/me/profile', input);
        return data;
    },

    list: async (params?: UserListParams): Promise<UserListResponse> => {
        // Note: apiClient.get(url, config) already wraps `config` as
        // `{ params: config }` internally (see lib/api/client.ts) — pass
        // the filters object directly here, not wrapped again.
        const data = await apiClient.get<UserListResponse>('/users', params);
        return data;
    },

    get: async (id: string): Promise<ManagedUser> => {
        const data = await apiClient.get<ManagedUser>(`/users/${id}`);
        return data;
    },

    getStats: async (): Promise<UserStats> => {
        const data = await apiClient.get<UserStats>('/users/stats');
        return data;
    },

    create: async (input: CreateUserPayload): Promise<ManagedUser> => {
        const data = await apiClient.post<ManagedUser>('/users', input);
        return data;
    },

    update: async (id: string, input: UpdateUserPayload): Promise<ManagedUser> => {
        const data = await apiClient.put<ManagedUser>(`/users/${id}`, input);
        return data;
    },

    remove: async (id: string): Promise<void> => {
        await apiClient.delete(`/users/${id}`);
    },

    assignRoles: async (id: string, roleIds: string[]): Promise<ManagedUser> => {
        const data = await apiClient.put<ManagedUser>(`/users/${id}/roles`, { roleIds });
        return data;
    },

    resetPassword: async (id: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
        const data = await apiClient.post<{ success: boolean; message: string }>(
            `/users/${id}/password-reset`,
            { newPassword },
        );
        return data;
    },

    getActivities: async (id: string, page = 1, limit = 20): Promise<UserActivityResponse> => {
        const data = await apiClient.get<UserActivityResponse>(`/users/${id}/activities`, { page, limit });
        return data;
    },

    // Re-sends the invitation email for a user who hasn't verified yet
    // (a fresh 48h link replaces any still-outstanding one).
    resendInvite: async (id: string): Promise<{ success: boolean; message: string }> => {
        const data = await apiClient.post<{ success: boolean; message: string }>(`/users/${id}/resend-invite`);
        return data;
    },
};
