// src/app/(dashboard)/category/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    useCategories,
    useDeleteCategory,
    useDeleteCategories,
    useExportCategories,
    useUpdateCategory,
} from '@/features/categories/hooks/useCategories';
import { CategoryTable, type StatusFilter } from '@/features/categories/components/CategoryTable';
import { Category } from '@/types/category.types';
import { type SortConfig } from '@/components/common/DataTable';

const PAGE_LIMIT = 20;

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function CategoryPage() {
    return (
        <ProtectedRoute requiredPermission={['category:read', 'category:view']}>
            <CategoryPageContent />
        </ProtectedRoute>
    );
}

function CategoryPageContent() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [parentFilter, setParentFilter] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    // Build query params
    const queryParams = {
        page,
        limit: PAGE_LIMIT,
        search: search || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        parentId: parentFilter ?? undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy: sortConfig?.key,
        sortOrder: sortConfig?.direction,
    };

    const { data, isLoading, isError, refetch } = useCategories(queryParams);

    const deleteCategory = useDeleteCategory();
    const deleteCategories = useDeleteCategories();
    const updateCategory = useUpdateCategory();
    const exportCategories = useExportCategories();

    const handleView = (category: Category) => {
        router.push(`/categories/${category.id}`);
    };

    const handleEdit = (category: Category) => {
        router.push(`/categories/${category.id}/edit`);
    };

    const handleDelete = (category: Category) => {
        const hasChildren = category.children.length > 0;
        const confirmed = window.confirm(
            hasChildren
                ? `"${category.name}" has ${category.children.length} subcategor${category.children.length === 1 ? 'y' : 'ies'}. Deleting it may affect those too. Continue?`
                : `Delete "${category.name}"? This can't be undone.`
        );

        if (confirmed) {
            deleteCategory.mutate(category.id, {
                onSuccess: () => {
                    refetch();
                }
            });
        }
    };

    const handleStatusChange = (category: Category, isActive: boolean) => {
        updateCategory.mutate({
            id: category.id,
            input: { isActive }
        }, {
            onSuccess: () => {
                refetch();
            }
        });
    };

    const handleDeleteSelected = (ids: string[]) => {
        const confirmed = window.confirm(
            `Delete ${ids.length} selected categor${ids.length === 1 ? 'y' : 'ies'}? This action cannot be undone.`
        );

        if (confirmed) {
            deleteCategories.mutate(ids, {
                onSuccess: () => {
                    setSelectedIds([]);
                    refetch();
                }
            });
        }
    };

    const handleAddClick = () => {
        router.push('/categories/new');
    };

    const handleExport = async () => {
        try {
            const blob = await exportCategories.mutateAsync({
                ...queryParams,
                limit: undefined,
                page: undefined,
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `categories-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const resetToFirstPage = () => setPage(1);

    return (
        <CategoryTable
            categories={Array.isArray(data) ? data : (data?.data ?? [])}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onDeleteSelected={handleDeleteSelected}
            page={data?.meta?.page ?? page}
            pageCount={data?.meta?.totalPages ?? 1}
            onPageChange={setPage}
            totalCount={data?.meta?.total}
            search={search}
            onSearchChange={(value) => {
                setSearch(value);
                resetToFirstPage();
            }}
            onAddClick={handleAddClick}
            onExportClick={handleExport}
            isExporting={exportCategories.isPending}
            statusFilter={statusFilter}
            onStatusFilterChange={(value) => {
                setStatusFilter(value);
                resetToFirstPage();
            }}
            parentFilter={parentFilter}
            onParentFilterChange={(value) => {
                setParentFilter(value);
                resetToFirstPage();
            }}
            dateFrom={dateFrom}
            onDateFromChange={(value) => {
                setDateFrom(value);
                resetToFirstPage();
            }}
            dateTo={dateTo}
            onDateToChange={(value) => {
                setDateTo(value);
                resetToFirstPage();
            }}
            sortConfig={sortConfig}
            onSortChange={setSortConfig}
        />
    );
}