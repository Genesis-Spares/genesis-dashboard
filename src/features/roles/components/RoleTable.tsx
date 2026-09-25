// src/features/roles/components/RoleTable.tsx
'use client';

import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { TableActions } from '@/components/common/TableActions';
import { Role } from '@/types/user-management.types';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface RoleTableProps {
    roles: Role[];
    isLoading?: boolean;
    isError?: boolean;
    onRetry?: () => void;
    onView?: (role: Role) => void;
    onDelete: (role: Role) => void;
    onAddClick?: () => void;
    search: string;
    onSearchChange: (value: string) => void;
    isDeleting?: boolean;
}

export function RoleTable({
    roles,
    isLoading,
    isError = false,
    onRetry,
    onView,
    onDelete,
    onAddClick,
    search,
    onSearchChange,
    isDeleting = false,
}: RoleTableProps) {
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; role: Role | null }>({
        isOpen: false,
        role: null,
    });

    const { can } = usePermissions();
    const canCreate = can({ permission: 'role:create' });
    const canDelete = can({ permission: 'role:delete' });

    const handleConfirmDelete = () => {
        if (deleteModal.role) onDelete(deleteModal.role);
        setDeleteModal({ isOpen: false, role: null });
    };

    const columns: DataTableColumn<Role>[] = [
        {
            id: 'actions',
            header: 'Actions',
            accessor: (role) => (
                <TableActions
                    onView={onView ? () => onView(role) : undefined}
                    // Built-in roles are protected server-side too — the
                    // delete button is simply hidden for them here.
                    onDelete={canDelete && !role.isSystem ? () => setDeleteModal({ isOpen: true, role }) : undefined}
                    size="md"
                />
            ),
            align: 'left',
        },
        {
            id: 'name',
            header: 'Role',
            accessor: (role) => (
                <button onClick={onView ? () => onView(role) : undefined} className="text-left">
                    <span className="font-medium text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {role.name}
                    </span>
                </button>
            ),
        },
        {
            id: 'type',
            header: 'Type',
            accessor: (role) => (
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {role.isSystem ? 'Built-in' : 'Custom'}
                </span>
            ),
        },
        {
            id: 'description',
            header: 'Description',
            accessor: (role) => (
                <span className="text-sm text-gray-600 dark:text-gray-300">{role.description || '—'}</span>
            ),
        },
        {
            id: 'permissions',
            header: 'Permissions',
            accessor: (role) => role.permissions?.length ?? 0,
            align: 'right',
        },
        {
            id: 'users',
            header: 'Users',
            accessor: (role) => role.userCount ?? 0,
            align: 'right',
        },
    ];

    const filtered = search
        ? roles.filter(
            (r) =>
                r.name.toLowerCase().includes(search.toLowerCase()) ||
                (r.description ?? '').toLowerCase().includes(search.toLowerCase()),
        )
        : roles;

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Roles &amp; Permissions</h2>
                        <p className="text-sm text-gray-400">{roles.length} roles</p>
                    </div>
                    {canCreate && onAddClick && (
                        <button
                            onClick={onAddClick}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            <PlusIcon className="w-4 h-4" />
                            New Role
                        </button>
                    )}
                </div>

                <DataTable
                    data={filtered}
                    columns={columns}
                    getRowId={(role) => role.id}
                    searchPlaceholder="Search roles"
                    searchValue={search}
                    onSearchChange={onSearchChange}
                    isLoading={isLoading}
                    isError={isError}
                    errorMessage="Failed to load roles."
                    onRetry={onRetry}
                    emptyMessage="No roles found."
                />
            </div>

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, role: null })}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
                title="Delete Role"
                itemName={deleteModal.role?.name}
                message={
                    deleteModal.role
                        ? `Delete the "${deleteModal.role.name}" role? This can't be undone. Roles that still have users assigned can't be deleted.`
                        : undefined
                }
                confirmText="Delete"
            />
        </>
    );
}
