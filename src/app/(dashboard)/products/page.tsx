'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    useProducts,
    useDeleteProduct,
    useDeleteProducts,
    useExportProducts,
    useUpdateProduct,
} from '@/features/products/hooks/useProducts';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { ProductTable, type StatusFilter, type StockFilter } from '@/features/products/ components/ProductTable';
import { Product } from '@/types/product.types';
import { type SortConfig } from '@/components/common/DataTable';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const PAGE_LIMIT = 20;

export default function ProductPage() {
    return (
        <ProtectedRoute requiredPermission={['catalog:read', 'catalog:view']}>
            <ProductPageContent />
        </ProtectedRoute>
    );
}

function ProductPageContent() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [stockFilter, setStockFilter] = useState<StockFilter>('all');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    const queryParams = {
        page,
        limit: PAGE_LIMIT,
        search: search || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        inStock: stockFilter === 'all' ? undefined : stockFilter === 'in_stock',
        categoryId: categoryFilter ?? undefined,
        sortBy: sortConfig?.key as any,
        sortOrder: sortConfig?.direction,
    };

    const { data, isLoading, isError, refetch } = useProducts(queryParams);
    const { data: categoriesData } = useCategories({ limit: 100 });

    const deleteProduct = useDeleteProduct();
    const deleteProducts = useDeleteProducts();
    const updateProduct = useUpdateProduct();
    const exportProducts = useExportProducts();

    const handleView = (product: Product) => {
        router.push(`/products/${product.id}`);
    };

    const handleEdit = (product: Product) => {
        router.push(`/products/${product.id}/edit`);
    };

    const handleDelete = (product: Product) => {
        const confirmed = window.confirm(`Delete "${product.name}"? This can't be undone.`);
        if (confirmed) {
            deleteProduct.mutate(product.id, {
                onSuccess: () => refetch(),
            });
        }
    };

    const handleStatusChange = (product: Product, isActive: boolean) => {
        updateProduct.mutate(
            { id: product.id, input: { isActive } },
            { onSuccess: () => refetch() }
        );
    };

    const handleDeleteSelected = (ids: string[]) => {
        const confirmed = window.confirm(
            `Delete ${ids.length} selected product${ids.length === 1 ? '' : 's'}? This action cannot be undone.`
        );
        if (confirmed) {
            deleteProducts.mutate(ids, {
                onSuccess: () => {
                    setSelectedIds([]);
                    refetch();
                },
            });
        }
    };

    const handleAddClick = () => {
        router.push('/products/new');
    };

    const handleExport = async () => {
        try {
            const blob = await exportProducts.mutateAsync({ ...queryParams, limit: undefined, page: undefined });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
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
        <ProductTable
            products={Array.isArray(data) ? data : (data?.data ?? [])}
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
            isExporting={exportProducts.isPending}
            statusFilter={statusFilter}
            onStatusFilterChange={(value) => {
                setStatusFilter(value);
                resetToFirstPage();
            }}
            stockFilter={stockFilter}
            onStockFilterChange={(value) => {
                setStockFilter(value);
                resetToFirstPage();
            }}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={(value) => {
                setCategoryFilter(value);
                resetToFirstPage();
            }}
            categoryOptions={(categoriesData?.data ?? []).map((c: any) => ({ id: c.id, name: c.name }))}
            sortConfig={sortConfig}
            onSortChange={setSortConfig}
        />
    );
}