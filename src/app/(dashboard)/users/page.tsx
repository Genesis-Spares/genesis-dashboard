'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useUsers, useCreateUser, useDeleteUser, useUpdateUser, useResendInvite } from '@/features/users/hooks/useUsers';
import { UserTable, type StatusFilter } from '@/features/users/components/UserTable';
import { CreateUserModal } from '@/features/users/components/CreateUserModal';
import { ManagedUser, CreateUserPayload } from '@/types/user-management.types';
import { type SortConfig } from '@/components/common/DataTable';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const PAGE_LIMIT = 20;

export default function UsersPage() {
    return (
        <ProtectedRoute requiredPermission={['user:read']}>
            <UsersPageContent />
        </ProtectedRoute>
    );
}

function UsersPageContent() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const queryParams = {
        page,
        limit: PAGE_LIMIT,
        search: search || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        sortBy: sortConfig?.key as any,
        sortOrder: sortConfig?.direction,
    };

    const { data, isLoading, isError, refetch } = useUsers(queryParams);

    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const deleteUser = useDeleteUser();
    const resendInvite = useResendInvite();

    const handleView = (user: ManagedUser) => {
        router.push(`/users/${user.id}`);
    };

    const handleDelete = (user: ManagedUser) => {
        deleteUser.mutate(user.id, { onSuccess: () => refetch() });
    };

    const handleStatusChange = (user: ManagedUser, isActive: boolean) => {
        updateUser.mutate({ id: user.id, input: { isActive } }, { onSuccess: () => refetch() });
    };

    const handleResendInvite = (user: ManagedUser) => {
        resendInvite.mutate(user.id, {
            onSuccess: () => toast.success(`Invitation resent to ${user.email}`),
            onError: (error: any) => toast.error(error?.message || 'Failed to resend invitation.'),
        });
    };

    const handleCreate = (input: CreateUserPayload) => {
        setCreateError(null);
        createUser.mutate(input, {
            onSuccess: () => {
                setCreateOpen(false);
                refetch();
            },
            onError: (error: any) => {
                setCreateError(error?.message || 'Failed to create user.');
            },
        });
    };

    const resetToFirstPage = () => setPage(1);

    return (
        <>
            <UserTable
                users={data?.data ?? []}
                isLoading={isLoading}
                isError={isError}
                onRetry={() => refetch()}
                onView={handleView}
                onStatusChange={handleStatusChange}
                onResendInvite={handleResendInvite}
                isResendingInvite={resendInvite.isPending}
                onDelete={handleDelete}
                onAddClick={() => {
                    setCreateError(null);
                    setCreateOpen(true);
                }}
                page={data?.meta.page ?? page}
                pageCount={data?.meta.totalPages ?? 1}
                onPageChange={setPage}
                totalCount={data?.meta.total}
                search={search}
                onSearchChange={(value) => {
                    setSearch(value);
                    resetToFirstPage();
                }}
                isDeleting={deleteUser.isPending}
                statusFilter={statusFilter}
                onStatusFilterChange={(value) => {
                    setStatusFilter(value);
                    resetToFirstPage();
                }}
                sortConfig={sortConfig}
                onSortChange={setSortConfig}
            />

            <CreateUserModal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                onSubmit={handleCreate}
                isSubmitting={createUser.isPending}
                errorMessage={createError}
            />
        </>
    );
}
