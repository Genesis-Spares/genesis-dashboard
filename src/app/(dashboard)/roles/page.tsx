'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRoles, useCreateRole, useDeleteRole } from '@/features/roles/hooks/useRoles';
import { RoleTable } from '@/features/roles/components/RoleTable';
import { RoleFormModal } from '@/features/roles/components/RoleFormModal';
import { Role, CreateRolePayload } from '@/types/user-management.types';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function RolesPage() {
    return (
        <ProtectedRoute requiredPermission={['role:read']}>
            <RolesPageContent />
        </ProtectedRoute>
    );
}

function RolesPageContent() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const { data: roles = [], isLoading, isError, refetch } = useRoles();
    const createRole = useCreateRole();
    const deleteRole = useDeleteRole();

    const handleView = (role: Role) => {
        router.push(`/roles/${role.id}`);
    };

    const handleCreate = (input: CreateRolePayload) => {
        setCreateError(null);
        createRole.mutate(input, {
            onSuccess: () => {
                setCreateOpen(false);
                refetch();
            },
            onError: (error: any) => setCreateError(error?.message || 'Failed to create role.'),
        });
    };

    const handleDelete = (role: Role) => {
        setDeleteError(null);
        deleteRole.mutate(role.id, {
            onSuccess: () => refetch(),
            onError: (error: any) => setDeleteError(error?.message || 'Failed to delete role.'),
        });
    };

    return (
        <>
            {deleteError && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm">
                    {deleteError}
                </div>
            )}

            <RoleTable
                roles={roles}
                isLoading={isLoading}
                isError={isError}
                onRetry={() => refetch()}
                onView={handleView}
                onDelete={handleDelete}
                onAddClick={() => {
                    setCreateError(null);
                    setCreateOpen(true);
                }}
                search={search}
                onSearchChange={setSearch}
                isDeleting={deleteRole.isPending}
            />

            <RoleFormModal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                onSubmit={handleCreate}
                isSubmitting={createRole.isPending}
                errorMessage={createError}
            />
        </>
    );
}
