// src/features/users/hooks/useUsers.ts
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { usersApi } from '../api/users.api';
import { UserListParams, CreateUserPayload, UpdateUserPayload, UpdateProfilePayload } from '@/types/user-management.types';

const userKeys = {
    all: ['users'] as const,
    lists: () => [...userKeys.all, 'list'] as const,
    list: (params?: UserListParams) => [...userKeys.lists(), params] as const,
    details: () => [...userKeys.all, 'detail'] as const,
    detail: (id: string) => [...userKeys.details(), id] as const,
    stats: () => [...userKeys.all, 'stats'] as const,
    activities: (id: string, page?: number, limit?: number) =>
        [...userKeys.detail(id), 'activities', page, limit] as const,
    myProfile: () => [...userKeys.all, 'me-profile'] as const,
};

export const useMyProfile = () => {
    return useQuery({
        queryKey: userKeys.myProfile(),
        queryFn: () => usersApi.getMyProfile(),
    });
};

export const useUpdateMyProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: UpdateProfilePayload) => usersApi.updateMyProfile(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.myProfile() });
        },
    });
};

export const useUsers = (params?: UserListParams, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: userKeys.list(params),
        queryFn: () => usersApi.list(params),
        placeholderData: keepPreviousData,
        enabled: options?.enabled ?? true,
    });
};

export const useUser = (id: string | undefined) => {
    return useQuery({
        queryKey: userKeys.detail(id ?? ''),
        queryFn: () => usersApi.get(id as string),
        enabled: Boolean(id),
    });
};

export const useUserStats = () => {
    return useQuery({
        queryKey: userKeys.stats(),
        queryFn: () => usersApi.getStats(),
    });
};

export const useUserActivities = (id: string | undefined, page = 1, limit = 20) => {
    return useQuery({
        queryKey: userKeys.activities(id ?? '', page, limit),
        queryFn: () => usersApi.getActivities(id as string, page, limit),
        enabled: Boolean(id),
    });
};

export const useCreateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateUserPayload) => usersApi.create(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            queryClient.invalidateQueries({ queryKey: userKeys.stats() });
        },
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateUserPayload }) => usersApi.update(id, input),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: userKeys.stats() });
        },
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => usersApi.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            queryClient.invalidateQueries({ queryKey: userKeys.stats() });
        },
    });
};

export const useAssignUserRoles = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (roleIds: string[]) => usersApi.assignRoles(id, roleIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        },
    });
};

export const useAdminResetPassword = (id: string) => {
    return useMutation({
        mutationFn: (newPassword: string) => usersApi.resetPassword(id, newPassword),
    });
};

export const useResendInvite = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => usersApi.resendInvite(id),
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        },
    });
};
