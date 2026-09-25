'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    useOrders,
    useCancelOrder,
    useBulkCancelOrders,
} from '@/features/orders/hooks/useOrders';
import { OrderTable, type OrderStatusFilter, type PaymentStatusFilter } from '@/features/orders/components/OrderTable';
import { Order } from '@/types/order.types';
import { type SortConfig } from '@/components/common/DataTable';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const PAGE_LIMIT = 20;

export default function OrdersPage() {
    return (
        <ProtectedRoute requiredPermission={['order:read']}>
            <OrdersPageContent />
        </ProtectedRoute>
    );
}

function OrdersPageContent() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusFilter>('all');
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    // deep links from the dashboard, e.g. /orders?status=PENDING
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        const payment = params.get('paymentStatus');
        if (status) setStatusFilter(status as OrderStatusFilter);
        if (payment) setPaymentStatusFilter(payment as PaymentStatusFilter);
    }, []);

    const queryParams = {
        page,
        limit: PAGE_LIMIT,
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        paymentStatus: paymentStatusFilter === 'all' ? undefined : paymentStatusFilter,
        sortBy: sortConfig?.key as any,
        sortOrder: sortConfig?.direction,
    };

    const { data, isLoading, isError, refetch } = useOrders(queryParams);

    const cancelOrder = useCancelOrder();
    const bulkCancelOrders = useBulkCancelOrders();

    const handleView = (order: Order) => {
        router.push(`/orders/${order.id}`);
    };

    const handleCancel = (order: Order) => {
        cancelOrder.mutate(
            { id: order.id, input: { reason: 'Cancelled by admin' } },
            { onSuccess: () => refetch() },
        );
    };

    const handleCancelSelected = (ids: string[]) => {
        bulkCancelOrders.mutate(ids, {
            onSuccess: () => {
                setSelectedIds([]);
                refetch();
            },
        });
    };

    const resetToFirstPage = () => setPage(1);

    return (
        <OrderTable
            orders={data?.data ?? []}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onView={handleView}
            onCancel={handleCancel}
            onCancelSelected={handleCancelSelected}
            isCancelling={cancelOrder.isPending || bulkCancelOrders.isPending}
            page={data?.meta.page ?? page}
            pageCount={data?.meta.totalPages ?? 1}
            onPageChange={setPage}
            totalCount={data?.meta.total}
            search={search}
            onSearchChange={(value) => {
                setSearch(value);
                resetToFirstPage();
            }}
            statusFilter={statusFilter}
            onStatusFilterChange={(value) => {
                setStatusFilter(value);
                resetToFirstPage();
            }}
            paymentStatusFilter={paymentStatusFilter}
            onPaymentStatusFilterChange={(value) => {
                setPaymentStatusFilter(value);
                resetToFirstPage();
            }}
            sortConfig={sortConfig}
            onSortChange={setSortConfig}
        />
    );
}
