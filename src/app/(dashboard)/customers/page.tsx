'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    useCustomers,
    useDeleteCustomer,
    useDeleteCustomers,
    useExportCustomers,
    useUpdateCustomer,
} from '@/features/customers/hooks/useCustomers';
import { CustomerTable, type StatusFilter, type TierFilter } from '@/features/customers/components/CustomerTable';
import { Customer } from '@/types/customer.types';
import { type SortConfig } from '@/components/common/DataTable';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const PAGE_LIMIT = 20;

export default function CustomerPage() {
    return (
        <ProtectedRoute requiredPermission={['customer:read']}>
            <CustomerPageContent />
        </ProtectedRoute>
    );
}

function CustomerPageContent() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [tierFilter, setTierFilter] = useState<TierFilter>('all');
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    const queryParams = {
        page,
        limit: PAGE_LIMIT,
        search: search || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        loyaltyTier: tierFilter === 'all' ? undefined : tierFilter,
        sortBy: sortConfig?.key as any,
        sortOrder: sortConfig?.direction,
    };

    const { data, isLoading, isError, refetch } = useCustomers(queryParams);

    const deleteCustomer = useDeleteCustomer();
    const deleteCustomers = useDeleteCustomers();
    const updateCustomer = useUpdateCustomer();
    const exportCustomers = useExportCustomers();

    const handleView = (customer: Customer) => {
        router.push(`/customers/${customer.id}`);
    };

    const handleDelete = (customer: Customer) => {
        const confirmed = window.confirm(
            `Delete "${customer.firstName} ${customer.lastName}"? This can't be undone.`
        );
        if (confirmed) {
            deleteCustomer.mutate(customer.id, {
                onSuccess: () => refetch(),
            });
        }
    };

    const handleStatusChange = (customer: Customer, isActive: boolean) => {
        updateCustomer.mutate(
            { id: customer.id, input: { isActive } },
            { onSuccess: () => refetch() }
        );
    };

    const handleDeleteSelected = (ids: string[]) => {
        const confirmed = window.confirm(
            `Delete ${ids.length} selected customer${ids.length === 1 ? '' : 's'}? This action cannot be undone.`
        );
        if (confirmed) {
            deleteCustomers.mutate(ids, {
                onSuccess: () => {
                    setSelectedIds([]);
                    refetch();
                },
            });
        }
    };

    const handleExport = async () => {
        try {
            const blob = await exportCustomers.mutateAsync({ ...queryParams, limit: undefined, page: undefined });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `customers-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    const resetToFirstPage = () => setPage(1);

    return (
        <CustomerTable
            customers={data?.data ?? []}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onView={handleView}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onDeleteSelected={handleDeleteSelected}
            page={data?.meta.page ?? page}
            pageCount={data?.meta.totalPages ?? 1}
            onPageChange={setPage}
            totalCount={data?.meta.total}
            search={search}
            onSearchChange={(value) => {
                setSearch(value);
                resetToFirstPage();
            }}
            onExportClick={handleExport}
            isExporting={exportCustomers.isPending}
            statusFilter={statusFilter}
            onStatusFilterChange={(value) => {
                setStatusFilter(value);
                resetToFirstPage();
            }}
            tierFilter={tierFilter}
            onTierFilterChange={(value) => {
                setTierFilter(value);
                resetToFirstPage();
            }}
            sortConfig={sortConfig}
            onSortChange={setSortConfig}
        />
    );
}