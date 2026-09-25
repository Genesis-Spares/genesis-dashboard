// src/features/roles/hooks/useRoles.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '../api/roles.api';
import { CreateRolePayload, UpdateRolePayload } from '@/types/user-management.types';

const roleKeys = {
    all: ['roles'] as const,
    lists: () => [...roleKeys.all, 'list'] as const,
    details: () => [...roleKeys.all, 'detail'] as const,
    detail: (id: string) => [...roleKeys.details(), id] as const,
    catalog: () => [...roleKeys.all, 'permission-catalog'] as const,
};

export const useRoles = () => {
    return useQuery({
        queryKey: roleKeys.lists(),
        queryFn: () => rolesApi.list(),
    });
};

export const useRole = (id: string | undefined) => {
    return useQuery({
        queryKey: roleKeys.detail(id ?? ''),
        queryFn: () => rolesApi.get(id as string),
        enabled: Boolean(id),
    });
};

export const usePermissionCatalog = () => {
    return useQuery({
        queryKey: roleKeys.catalog(),
        queryFn: () => rolesApi.getPermissionCatalog(),
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreateRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateRolePayload) => rolesApi.create(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
        },
    });
};

export const useUpdateRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateRolePayload }) => rolesApi.update(id, input),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
            queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.id) });
        },
    });
};

export const useDeleteRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => rolesApi.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
        },
    });
};

export const useAssignRolePermissions = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (permissionIds: string[]) => rolesApi.assignPermissions(id, permissionIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
        },
    });
};
