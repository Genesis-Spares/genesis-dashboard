'use client';

import { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { DataTable, type DataTableColumn, type SortConfig, type BatchAction } from '@/components/common/DataTable';
import { type FilterConfig, type FilterValue } from '@/components/common/FilterBar';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { TableActions, createStatusActions } from '@/components/common/TableActions';
import { Customer, LoyaltyTier } from '@/types/customer.types';
import { usePermissions } from '@/lib/hooks/usePermissions';

export type StatusFilter = 'all' | 'active' | 'inactive';
export type TierFilter = 'all' | LoyaltyTier;

interface CustomerTableProps {
    customers: Customer[];
    isLoading?: boolean;
    isError?: boolean;
    onRetry?: () => void;
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    onView?: (customer: Customer) => void;
    onStatusChange?: (customer: Customer, isActive: boolean) => void;
    onDelete: (customer: Customer) => void;
    onDeleteSelected?: (ids: string[]) => void;
    page: number;
    pageCount: number;
    onPageChange: (page: number) => void;
    search: string;
    onSearchChange: (value: string) => void;
    onExportClick?: () => void;
    isExporting?: boolean;
    isDeleting?: boolean;
    totalCount?: number;
    statusFilter?: StatusFilter;
    onStatusFilterChange?: (value: StatusFilter) => void;
    tierFilter?: TierFilter;
    onTierFilterChange?: (value: TierFilter) => void;
    sortConfig?: SortConfig | null;
    onSortChange?: (sort: SortConfig | null) => void;
}

function initials(customer: Customer) {
    return `${customer.firstName?.[0] ?? ''}${customer.lastName?.[0] ?? ''}`.toUpperCase();
}

export function CustomerTable({
    customers,
    isLoading,
    isError = false,
    onRetry,
    selectedIds,
    onSelectionChange,
    onView,
    onStatusChange,
    onDelete,
    onDeleteSelected,
    page,
    pageCount,
    onPageChange,
    search,
    onSearchChange,
    onExportClick,
    isExporting = false,
    isDeleting = false,
    totalCount,
    statusFilter = 'all',
    onStatusFilterChange,
    tierFilter = 'all',
    onTierFilterChange,
    sortConfig,
    onSortChange,
}: CustomerTableProps) {
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        customer: Customer | null;
        isBatch: boolean;
        count?: number;
    }>({
        isOpen: false,
        customer: null,
        isBatch: false,
    });

    const { can } = usePermissions();

    const canManage = can({ permission: 'customer:manage' });
    const canDelete = can({ permission: 'customer:delete' });
    const canExport = can({ permission: ['customer:read', 'customer:manage'] });

    const filterConfigs: FilterConfig[] = [
        ...(onStatusFilterChange ? [{
            key: 'status',
            label: 'Status',
            type: 'select' as const,
            options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
            ],
        }] : []),
        ...(onTierFilterChange ? [{
            key: 'tier',
            label: 'Loyalty Tier',
            type: 'select' as const,
            options: [
                { value: 'BRONZE', label: 'Bronze' },
                { value: 'SILVER', label: 'Silver' },
                { value: 'GOLD', label: 'Gold' },
                { value: 'PLATINUM', label: 'Platinum' },
            ],
        }] : []),
    ];

    const filterValues: Record<string, FilterValue> = {};
    if (onStatusFilterChange) filterValues.status = statusFilter;
    if (onTierFilterChange) filterValues.tier = tierFilter;

    const handleFilterChange = (key: string, value: FilterValue) => {
        switch (key) {
            case 'status':
                onStatusFilterChange?.(value as StatusFilter);
                break;
            case 'tier':
                onTierFilterChange?.(value as TierFilter);
                break;
        }
    };

    const handleDeleteClick = (customer: Customer) => {
        setDeleteModal({ isOpen: true, customer, isBatch: false });
    };

    const handleBatchDeleteClick = (ids: string[]) => {
        setDeleteModal({ isOpen: true, customer: null, isBatch: true, count: ids.length });
    };

    const handleConfirmDelete = () => {
        if (deleteModal.isBatch) {
            onDeleteSelected?.(selectedIds);
        } else if (deleteModal.customer) {
            onDelete(deleteModal.customer);
        }
        setDeleteModal({ isOpen: false, customer: null, isBatch: false });
    };

    const batchActions: BatchAction[] = (onDeleteSelected && canDelete) ? [
        {
            label: 'Delete Selected',
            icon: <TrashIcon className="w-4 h-4" />,
            onClick: () => handleBatchDeleteClick(selectedIds),
            variant: 'danger',
        },
    ] : [];

    const columns: DataTableColumn<Customer>[] = [
        {
            id: 'actions',
            header: 'Actions',
            accessor: (customer) => {
                const statusActions = (onStatusChange && canManage) ? createStatusActions(
                    () => onStatusChange(customer, true),
                    () => onStatusChange(customer, false)
                ) : [];

                return (
                    <TableActions
                        onView={onView ? () => onView(customer) : undefined}
                        onDelete={canDelete ? () => handleDeleteClick(customer) : undefined}
                        secondaryActions={statusActions}
                        size="md"
                    />
                );
            },
            align: 'left',
        },
        {
            id: 'avatar',
            header: 'Avatar',
            accessor: (customer) => (
                <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center overflow-hidden shrink-0">
                    {customer.avatar ? (
                        <img src={customer.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-xs font-semibold">{initials(customer)}</span>
                    )}
                </div>
            ),
        },
        {
            id: 'name',
            header: 'Name',
            accessor: (customer) => (
                <button
                    onClick={onView ? () => onView(customer) : undefined}
                    className="flex items-center gap-3 text-left"
                >
                    <span className="font-medium text-gray-800 dark:text-gray-100 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {customer.firstName} {customer.lastName}
                    </span>
                </button>
            ),
            sortable: true,
            sortKey: 'firstName',
        },
        {
            id: 'email',
            header: 'Email',
            accessor: (customer) => (
                <span className="text-sm text-gray-600 dark:text-gray-300">{customer.email}</span>
            ),
            sortable: true,
            sortKey: 'email',
        },
        {
            id: 'phone',
            header: 'Phone',
            accessor: (customer) => customer.phone ?? '—',
        },
        {
            id: 'loyaltyTier',
            header: 'Tier',
            accessor: (customer) => (
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {customer.loyaltyTier}
                </span>
            ),
            sortable: true,
            sortKey: 'loyaltyTier',
        },
        {
            id: 'loyaltyPoints',
            header: 'Points',
            accessor: (customer) => customer.loyaltyPoints.toLocaleString(),
            align: 'right',
            sortable: true,
            sortKey: 'loyaltyPoints',
        },
        {
            id: 'status',
            header: 'Status',
            accessor: (customer) => (
                <span className="text-sm font-bold text-blue-600 dark:text-blue-600">
                    {customer.isActive ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            id: 'lastLoginAt',
            header: 'Last Login',
            accessor: (customer) => (customer.lastLoginAt ? new Date(customer.lastLoginAt).toLocaleDateString() : 'Never'),
            sortable: true,
            sortKey: 'lastLoginAt',
        },
        {
            id: 'createdAt',
            header: 'Joined',
            accessor: (customer) => new Date(customer.createdAt).toLocaleDateString(),
            sortable: true,
            sortKey: 'createdAt',
        },
    ];

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Customers</h2>
                        {typeof totalCount === 'number' && (
                            <p className="text-sm text-gray-400">{totalCount} total</p>
                        )}
                    </div>
                </div>

                <DataTable
                    data={customers}
                    columns={columns}
                    getRowId={(customer) => customer.id}
                    searchPlaceholder="Search customers"
                    searchValue={search}
                    onSearchChange={onSearchChange}
                    selectable={canDelete}
                    selectedIds={selectedIds}
                    onSelectionChange={onSelectionChange}
                    page={page}
                    pageCount={pageCount}
                    onPageChange={onPageChange}
                    isLoading={isLoading}
                    isError={isError}
                    errorMessage="Failed to load customers."
                    onRetry={onRetry}
                    emptyMessage="No customers yet."
                    filterConfigs={filterConfigs}
                    filterValues={filterValues}
                    onFilterChange={handleFilterChange}
                    sortConfig={sortConfig}
                    onSortChange={onSortChange}
                    onExportClick={canExport ? onExportClick : undefined}
                    isExporting={isExporting}
                    batchActions={batchActions}
                />
            </div>

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, customer: null, isBatch: false })}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
                title={deleteModal.isBatch ? 'Delete Selected Customers' : 'Delete Customer'}
                itemName={
                    deleteModal.isBatch
                        ? `${deleteModal.count} customer${deleteModal.count === 1 ? '' : 's'}`
                        : `${deleteModal.customer?.firstName} ${deleteModal.customer?.lastName}`
                }
                message={
                    deleteModal.isBatch
                        ? `Are you sure you want to delete ${deleteModal.count} selected customer${deleteModal.count === 1 ? '' : 's'}? This action cannot be undone.`
                        : undefined
                }
                confirmText={deleteModal.isBatch ? `Delete ${deleteModal.count} Items` : 'Delete'}
            />
        </>
    );
}