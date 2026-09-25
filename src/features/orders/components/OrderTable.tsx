'use client';

import { useState } from 'react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { DataTable, type DataTableColumn, type SortConfig, type BatchAction } from '@/components/common/DataTable';
import { type FilterConfig, type FilterValue } from '@/components/common/FilterBar';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { TableActions } from '@/components/common/TableActions';
import { Order, OrderStatus, PaymentStatus } from '@/types/order.types';
import { usePermissions } from '@/lib/hooks/usePermissions';

export type OrderStatusFilter = 'all' | OrderStatus;
export type PaymentStatusFilter = 'all' | PaymentStatus;

export function formatMoney(value: string | number | undefined, currency = 'KES') {
    const amount = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    try {
        return new Intl.NumberFormat('en-KE', { style: 'currency', currency }).format(amount);
    } catch {
        return `${currency} ${amount.toFixed(2)}`;
    }
}

interface OrderTableProps {
    orders: Order[];
    isLoading?: boolean;
    isError?: boolean;
    onRetry?: () => void;
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    onView?: (order: Order) => void;
    onCancel: (order: Order) => void;
    onCancelSelected?: (ids: string[]) => void;
    page: number;
    pageCount: number;
    onPageChange: (page: number) => void;
    search: string;
    onSearchChange: (value: string) => void;
    isCancelling?: boolean;
    totalCount?: number;
    statusFilter?: OrderStatusFilter;
    onStatusFilterChange?: (value: OrderStatusFilter) => void;
    paymentStatusFilter?: PaymentStatusFilter;
    onPaymentStatusFilterChange?: (value: PaymentStatusFilter) => void;
    sortConfig?: SortConfig | null;
    onSortChange?: (sort: SortConfig | null) => void;
}

export function OrderTable({
    orders,
    isLoading,
    isError = false,
    onRetry,
    selectedIds,
    onSelectionChange,
    onView,
    onCancel,
    onCancelSelected,
    page,
    pageCount,
    onPageChange,
    search,
    onSearchChange,
    isCancelling = false,
    totalCount,
    statusFilter = 'all',
    onStatusFilterChange,
    paymentStatusFilter = 'all',
    onPaymentStatusFilterChange,
    sortConfig,
    onSortChange,
}: OrderTableProps) {
    const [cancelModal, setCancelModal] = useState<{
        isOpen: boolean;
        order: Order | null;
        isBatch: boolean;
        count?: number;
    }>({
        isOpen: false,
        order: null,
        isBatch: false,
    });

    const { can } = usePermissions();

    const canUpdate = can({ permission: 'order:update' });
    const canManage = can({ permission: 'order:manage' });

    const filterConfigs: FilterConfig[] = [
        ...(onStatusFilterChange
            ? [
                {
                    key: 'status',
                    label: 'Status',
                    type: 'select' as const,
                    options: [
                        { value: 'PENDING', label: 'Pending' },
                        { value: 'CONFIRMED', label: 'Confirmed' },
                        { value: 'PROCESSING', label: 'Processing' },
                        { value: 'SHIPPED', label: 'Shipped' },
                        { value: 'DELIVERED', label: 'Delivered' },
                        { value: 'CANCELLED', label: 'Cancelled' },
                        { value: 'REFUNDED', label: 'Refunded' },
                    ],
                },
            ]
            : []),
        ...(onPaymentStatusFilterChange
            ? [
                {
                    key: 'paymentStatus',
                    label: 'Payment',
                    type: 'select' as const,
                    options: [
                        { value: 'PENDING', label: 'Pending' },
                        { value: 'PAID', label: 'Paid' },
                        { value: 'FAILED', label: 'Failed' },
                        { value: 'REFUNDED', label: 'Refunded' },
                        { value: 'PARTIALLY_REFUNDED', label: 'Partially Refunded' },
                    ],
                },
            ]
            : []),
    ];

    const filterValues: Record<string, FilterValue> = {};
    if (onStatusFilterChange) filterValues.status = statusFilter;
    if (onPaymentStatusFilterChange) filterValues.paymentStatus = paymentStatusFilter;

    const handleFilterChange = (key: string, value: FilterValue) => {
        switch (key) {
            case 'status':
                onStatusFilterChange?.(value as OrderStatusFilter);
                break;
            case 'paymentStatus':
                onPaymentStatusFilterChange?.(value as PaymentStatusFilter);
                break;
        }
    };

    const handleCancelClick = (order: Order) => {
        setCancelModal({ isOpen: true, order, isBatch: false });
    };

    const handleBatchCancelClick = (ids: string[]) => {
        setCancelModal({ isOpen: true, order: null, isBatch: true, count: ids.length });
    };

    const handleConfirmCancel = () => {
        if (cancelModal.isBatch) {
            onCancelSelected?.(selectedIds);
        } else if (cancelModal.order) {
            onCancel(cancelModal.order);
        }
        setCancelModal({ isOpen: false, order: null, isBatch: false });
    };

    const batchActions: BatchAction[] = (onCancelSelected && canUpdate) ? [
        {
            label: 'Cancel Selected',
            icon: <XCircleIcon className="w-4 h-4" />,
            onClick: () => handleBatchCancelClick(selectedIds),
            variant: 'danger',
        },
    ] : [];

    const columns: DataTableColumn<Order>[] = [
        {
            id: 'actions',
            header: 'Actions',
            accessor: (order) => (
                <TableActions
                    onView={onView ? () => onView(order) : undefined}
                    onDelete={
                        canUpdate && !['CANCELLED', 'DELIVERED', 'REFUNDED'].includes(order.status)
                            ? () => handleCancelClick(order)
                            : undefined
                    }
                    size="md"
                />
            ),
            align: 'left',
        },
        {
            id: 'orderNumber',
            header: 'Order #',
            accessor: (order) => (
                <button
                    onClick={onView ? () => onView(order) : undefined}
                    className="font-medium text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-mono text-sm"
                >
                    {order.orderNumber}
                </button>
            ),
            sortable: true,
            sortKey: 'orderNumber',
        },
        {
            id: 'customer',
            header: 'Customer',
            accessor: (order) => (
                <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{order.customerName}</p>
                    <p className="text-xs text-gray-400 truncate">{order.customerEmail}</p>
                </div>
            ),
        },
        {
            id: 'items',
            header: 'Items',
            accessor: (order) => order._count?.items ?? order.items?.length ?? '—',
            align: 'center',
        },
        {
            id: 'total',
            header: 'Total',
            accessor: (order) => (
                <span className="font-medium text-gray-800 dark:text-gray-100">
                    {formatMoney(order.total, order.currency)}
                </span>
            ),
            align: 'right',
            sortable: true,
            sortKey: 'total',
        },
        {
            id: 'status',
            header: 'Status',
            accessor: (order) => (
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {order.status}
                </span>
            ),
            sortable: true,
            sortKey: 'status',
        },
        {
            id: 'paymentStatus',
            header: 'Payment',
            accessor: (order) => (
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {order.paymentStatus.replace('_', ' ')}
                </span>
            ),
        },
        {
            id: 'createdAt',
            header: 'Placed',
            accessor: (order) => new Date(order.createdAt).toLocaleDateString(),
            sortable: true,
            sortKey: 'createdAt',
        },
    ];

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Orders</h2>
                        {typeof totalCount === 'number' && (
                            <p className="text-sm text-gray-400">{totalCount} total</p>
                        )}
                    </div>
                </div>

                <DataTable
                    data={orders}
                    columns={columns}
                    getRowId={(order) => order.id}
                    searchPlaceholder="Search orders"
                    searchValue={search}
                    onSearchChange={onSearchChange}
                    selectable={canManage}
                    selectedIds={selectedIds}
                    onSelectionChange={onSelectionChange}
                    page={page}
                    pageCount={pageCount}
                    onPageChange={onPageChange}
                    isLoading={isLoading}
                    isError={isError}
                    errorMessage="Failed to load orders."
                    onRetry={onRetry}
                    emptyMessage="No orders yet."
                    filterConfigs={filterConfigs}
                    filterValues={filterValues}
                    onFilterChange={handleFilterChange}
                    sortConfig={sortConfig}
                    onSortChange={onSortChange}
                    batchActions={batchActions}
                />
            </div>

            <DeleteConfirmationModal
                isOpen={cancelModal.isOpen}
                onClose={() => setCancelModal({ isOpen: false, order: null, isBatch: false })}
                onConfirm={handleConfirmCancel}
                isDeleting={isCancelling}
                title={cancelModal.isBatch ? 'Cancel Selected Orders' : 'Cancel Order'}
                itemName={cancelModal.isBatch ? `${cancelModal.count} order${cancelModal.count === 1 ? '' : 's'}` : cancelModal.order?.orderNumber}
                message={
                    cancelModal.isBatch
                        ? `Are you sure you want to cancel ${cancelModal.count} selected order${cancelModal.count === 1 ? '' : 's'}? This cannot be undone.`
                        : `Are you sure you want to cancel order "${cancelModal.order?.orderNumber}"? This cannot be undone.`
                }
                confirmText={cancelModal.isBatch ? `Cancel ${cancelModal.count} Orders` : 'Cancel Order'}
            />
        </>
    );
}
