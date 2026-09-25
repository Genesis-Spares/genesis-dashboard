// src/features/users/components/UserTable.tsx
'use client';

import { useState } from 'react';
import { PlusIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { DataTable, type DataTableColumn, type SortConfig } from '@/components/common/DataTable';
import { type FilterConfig, type FilterValue } from '@/components/common/FilterBar';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { TableActions, createStatusActions, type ActionItem } from '@/components/common/TableActions';
import { ManagedUser } from '@/types/user-management.types';
import { usePermissions } from '@/lib/hooks/usePermissions';

export type StatusFilter = 'all' | 'active' | 'inactive';

interface UserTableProps {
    users: ManagedUser[];
    isLoading?: boolean;
    isError?: boolean;
    onRetry?: () => void;
    onView?: (user: ManagedUser) => void;
    onStatusChange?: (user: ManagedUser, isActive: boolean) => void;
    onResendInvite?: (user: ManagedUser) => void;
    isResendingInvite?: boolean;
    onDelete: (user: ManagedUser) => void;
    onAddClick?: () => void;
    page: number;
    pageCount: number;
    onPageChange: (page: number) => void;
    search: string;
    onSearchChange: (value: string) => void;
    isDeleting?: boolean;
    totalCount?: number;
    statusFilter?: StatusFilter;
    onStatusFilterChange?: (value: StatusFilter) => void;
    sortConfig?: SortConfig | null;
    onSortChange?: (sort: SortConfig | null) => void;
}

function initials(user: ManagedUser) {
    return `${user.firstname?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
}

export function UserTable({
    users,
    isLoading,
    isError = false,
    onRetry,
    onView,
    onStatusChange,
    onResendInvite,
    isResendingInvite = false,
    onDelete,
    onAddClick,
    page,
    pageCount,
    onPageChange,
    search,
    onSearchChange,
    isDeleting = false,
    totalCount,
    statusFilter = 'all',
    onStatusFilterChange,
    sortConfig,
    onSortChange,
}: UserTableProps) {
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: ManagedUser | null }>({
        isOpen: false,
        user: null,
    });

    const { can } = usePermissions();
    const canUpdate = can({ permission: 'user:update' });
    const canDelete = can({ permission: 'user:delete' });
    const canCreate = can({ permission: 'user:create' });

    const filterConfigs: FilterConfig[] = onStatusFilterChange
        ? [
            {
                key: 'status',
                label: 'Status',
                type: 'select' as const,
                options: [
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                ],
            },
        ]
        : [];

    const filterValues: Record<string, FilterValue> = {};
    if (onStatusFilterChange) filterValues.status = statusFilter;

    const handleFilterChange = (key: string, value: FilterValue) => {
        if (key === 'status') onStatusFilterChange?.(value as StatusFilter);
    };

    const handleDeleteClick = (user: ManagedUser) => {
        setDeleteModal({ isOpen: true, user });
    };

    const handleConfirmDelete = () => {
        if (deleteModal.user) onDelete(deleteModal.user);
        setDeleteModal({ isOpen: false, user: null });
    };

    const columns: DataTableColumn<ManagedUser>[] = [
        {
            id: 'actions',
            header: 'Actions',
            accessor: (user) => {
                const statusActions = onStatusChange && canUpdate
                    ? createStatusActions(
                        () => onStatusChange(user, true),
                        () => onStatusChange(user, false),
                    )
                    : [];

                const inviteActions: ActionItem[] =
                    onResendInvite && canUpdate && !user.isEmailVerified
                        ? [
                            {
                                label: 'Resend Invite',
                                icon: <PaperAirplaneIcon className="w-4 h-4 text-blue-500" />,
                                onClick: () => onResendInvite(user),
                                variant: 'info',
                                disabled: isResendingInvite,
                                divider: statusActions.length === 0,
                            },
                        ]
                        : [];

                return (
                    <TableActions
                        onView={onView ? () => onView(user) : undefined}
                        onDelete={canDelete ? () => handleDeleteClick(user) : undefined}
                        secondaryActions={[...inviteActions, ...statusActions]}
                        size="md"
                    />
                );
            },
            align: 'left',
        },
        {
            id: 'avatar',
            header: 'Avatar',
            accessor: (user) => (
                <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center overflow-hidden shrink-0">
                    <span className="text-xs font-semibold">{initials(user)}</span>
                </div>
            ),
        },
        {
            id: 'name',
            header: 'Name',
            accessor: (user) => (
                <button onClick={onView ? () => onView(user) : undefined} className="flex items-center gap-3 text-left">
                    <span className="font-medium text-gray-800 dark:text-gray-100 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {user.firstname} {user.lastName}
                    </span>
                </button>
            ),
            sortable: true,
            sortKey: 'firstname',
        },
        {
            id: 'email',
            header: 'Email',
            accessor: (user) => <span className="text-sm text-gray-600 dark:text-gray-300">{user.email}</span>,
            sortable: true,
            sortKey: 'email',
        },
        {
            id: 'roles',
            header: 'Roles',
            accessor: (user) => (
                <div className="flex flex-wrap gap-1">
                    {user.roles.length === 0 ? (
                        <span className="text-xs text-gray-400">No roles</span>
                    ) : (
                        user.roles.map((role) => (
                            <span
                                key={role.id}
                                className="text-xs font-medium text-blue-600 dark:text-blue-400"
                            >
                                {role.name}
                            </span>
                        ))
                    )}
                </div>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            accessor: (user) => (
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {user.status.charAt(0) + user.status.slice(1).toLowerCase()}
                </span>
            ),
        },
        {
            id: 'verified',
            header: 'Verified',
            accessor: (user) => (
                <span className={`text-xs font-medium ${user.isEmailVerified ? 'text-blue-600' : 'text-gray-400'}`}>
                    {user.isEmailVerified ? 'Verified' : 'Unverified'}
                </span>
            ),
        },
        {
            id: 'createAt',
            header: 'Joined',
            accessor: (user) => new Date(user.createAt).toLocaleDateString(),
            sortable: true,
            sortKey: 'createAt',
        },
    ];

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Users</h2>
                        {typeof totalCount === 'number' && <p className="text-sm text-gray-400">{totalCount} total</p>}
                    </div>
                    {canCreate && onAddClick && (
                        <button
                            onClick={onAddClick}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add User
                        </button>
                    )}
                </div>

                <DataTable
                    data={users}
                    columns={columns}
                    getRowId={(user) => user.id}
                    searchPlaceholder="Search users"
                    searchValue={search}
                    onSearchChange={onSearchChange}
                    page={page}
                    pageCount={pageCount}
                    onPageChange={onPageChange}
                    isLoading={isLoading}
                    isError={isError}
                    errorMessage="Failed to load users."
                    onRetry={onRetry}
                    emptyMessage="No users yet."
                    filterConfigs={filterConfigs}
                    filterValues={filterValues}
                    onFilterChange={handleFilterChange}
                    sortConfig={sortConfig}
                    onSortChange={onSortChange}
                />
            </div>

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, user: null })}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
                title="Deactivate User"
                itemName={deleteModal.user ? `${deleteModal.user.firstname} ${deleteModal.user.lastName}` : undefined}
                message={
                    deleteModal.user
                        ? `Are you sure you want to deactivate "${deleteModal.user.firstname} ${deleteModal.user.lastName}"? Their account will be disabled and their sessions revoked. This does not permanently delete their data.`
                        : undefined
                }
                confirmText="Deactivate"
            />
        </>
    );
}
