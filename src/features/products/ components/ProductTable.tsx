'use client';

import { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { DataTable, type DataTableColumn, type SortConfig, type BatchAction } from '@/components/common/DataTable';
import { type FilterConfig, type FilterValue } from '@/components/common/FilterBar';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { TableActions, createStatusActions } from '@/components/common/TableActions';
import { Product } from '@/types/product.types';
import { usePermissions } from '@/lib/hooks/usePermissions';

export type StatusFilter = 'all' | 'active' | 'inactive';
export type StockFilter = 'all' | 'in_stock' | 'out_of_stock';

interface CategoryOption {
    id: string;
    name: string;
}

interface ProductTableProps {
    products: Product[];
    isLoading?: boolean;
    isError?: boolean;
    onRetry?: () => void;
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    onView?: (product: Product) => void;
    onStatusChange?: (product: Product, isActive: boolean) => void;
    onDeleteSelected?: (ids: string[]) => void;
    page: number;
    pageCount: number;
    onPageChange: (page: number) => void;
    search: string;
    onSearchChange: (value: string) => void;
    onAddClick: () => void;
    onExportClick?: () => void;
    isExporting?: boolean;
    isDeleting?: boolean;
    totalCount?: number;
    statusFilter?: StatusFilter;
    onStatusFilterChange?: (value: StatusFilter) => void;
    stockFilter?: StockFilter;
    onStockFilterChange?: (value: StockFilter) => void;
    categoryFilter?: string | null;
    onCategoryFilterChange?: (categoryId: string | null) => void;
    categoryOptions?: CategoryOption[];
    sortConfig?: SortConfig | null;
    onSortChange?: (sort: SortConfig | null) => void;
}

function formatPrice(value: number) {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        maximumFractionDigits: 0,
    }).format(value);
}

export function ProductTable({
    products,
    isLoading,
    isError = false,
    onRetry,
    selectedIds,
    onSelectionChange,
    onEdit,
    onDelete,
    onView,
    onStatusChange,
    onDeleteSelected,
    page,
    pageCount,
    onPageChange,
    search,
    onSearchChange,
    onAddClick,
    onExportClick,
    isExporting = false,
    isDeleting = false,
    totalCount,
    statusFilter = 'all',
    onStatusFilterChange,
    stockFilter = 'all',
    onStockFilterChange,
    categoryFilter = null,
    onCategoryFilterChange,
    categoryOptions = [],
    sortConfig,
    onSortChange,
}: ProductTableProps) {
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        product: Product | null;
        isBatch: boolean;
        count?: number;
    }>({
        isOpen: false,
        product: null,
        isBatch: false,
    });

    const { can } = usePermissions();

    const canCreate = can({ permission: 'catalog:manage' });
    const canEdit = can({ permission: 'catalog:manage' });
    const canDelete = can({ permission: 'catalog:manage' });
    const canExport = can({ permission: ['catalog:read', 'catalog:export'] });

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
        ...(onStockFilterChange ? [{
            key: 'stock',
            label: 'Stock',
            type: 'select' as const,
            options: [
                { value: 'in_stock', label: 'In Stock' },
                { value: 'out_of_stock', label: 'Out of Stock' },
            ],
        }] : []),
        ...(onCategoryFilterChange ? [{
            key: 'category',
            label: 'Category',
            type: 'select' as const,
            options: categoryOptions.map((opt) => ({ value: opt.id, label: opt.name })),
        }] : []),
    ];

    const filterValues: Record<string, FilterValue> = {};
    if (onStatusFilterChange) filterValues.status = statusFilter;
    if (onStockFilterChange) filterValues.stock = stockFilter;
    if (onCategoryFilterChange) filterValues.category = categoryFilter || 'all';

    const handleFilterChange = (key: string, value: FilterValue) => {
        switch (key) {
            case 'status':
                onStatusFilterChange?.(value as StatusFilter);
                break;
            case 'stock':
                onStockFilterChange?.(value as StockFilter);
                break;
            case 'category':
                onCategoryFilterChange?.(value === 'all' ? null : (value as string));
                break;
        }
    };

    const handleDeleteClick = (product: Product) => {
        setDeleteModal({ isOpen: true, product, isBatch: false });
    };

    const handleBatchDeleteClick = (ids: string[]) => {
        setDeleteModal({ isOpen: true, product: null, isBatch: true, count: ids.length });
    };

    const handleConfirmDelete = () => {
        if (deleteModal.isBatch) {
            onDeleteSelected?.(selectedIds);
        } else if (deleteModal.product) {
            onDelete(deleteModal.product);
        }
        setDeleteModal({ isOpen: false, product: null, isBatch: false });
    };

    const batchActions: BatchAction[] = (onDeleteSelected && canDelete) ? [
        {
            label: 'Delete Selected',
            icon: <TrashIcon className="w-4 h-4" />,
            onClick: () => handleBatchDeleteClick(selectedIds),
            variant: 'danger',
        },
    ] : [];

    const columns: DataTableColumn<Product>[] = [
        {
            id: 'actions',
            header: 'Actions',
            accessor: (product) => {
                const statusActions = (onStatusChange && canEdit) ? createStatusActions(
                    () => onStatusChange(product, true),
                    () => onStatusChange(product, false)
                ) : [];

                return (
                    <TableActions
                        onView={onView ? () => onView(product) : undefined}
                        onEdit={canEdit ? () => onEdit(product) : undefined}
                        onDelete={canDelete ? () => handleDeleteClick(product) : undefined}
                        secondaryActions={statusActions}
                        size="md"
                    />
                );
            },
            align: 'left',
        },
        {
            id: 'image',
            header: 'Image',
            accessor: (product) => {
                const primaryImage = product.images?.find((img) => img.isPrimary) ?? product.images?.[0];
                return (
                    <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                        {primaryImage ? (
                            <img
                                src={primaryImage.url}
                                alt={primaryImage.alt ?? product.name}
                                width={36}
                                height={36}
                                className="object-cover"
                            />
                        ) : (
                            <span className="text-xs text-gray-400">{product.name?.[0]?.toUpperCase() ?? '?'}</span>
                        )}
                    </div>
                );
            },
        },
        {
            id: 'name',
            header: 'Name',
            accessor: (product) => (
                <div className="relative group inline-block max-w-full">
                    <button
                        onClick={onView ? () => onView(product) : undefined}
                        className="block max-w-full font-medium text-gray-800 dark:text-gray-100 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                    >
                        {product.name}
                    </button>
                    <p className="text-xs text-gray-400 truncate">{product.sku}</p>
                </div>
            ),
            sortable: true,
            sortKey: 'name',
        },
        {
            id: 'brand',
            header: 'Brand',
            accessor: (product) => product.brand ?? '—',
            sortable: true,
            sortKey: 'brand',
        },
        {
            id: 'category',
            header: 'Category',
            accessor: (product) => product.category?.name ?? '—',
        },
        {
            id: 'price',
            header: 'Price',
            accessor: (product) => (
                <div>
                    <span className="font-medium">{formatPrice(product.price)}</span>
                    {product.comparePrice && product.comparePrice > product.price && (
                        <p className="text-xs text-gray-400 line-through">{formatPrice(product.comparePrice)}</p>
                    )}
                </div>
            ),
            align: 'right',
            sortable: true,
            sortKey: 'price',
        },
        {
            id: 'stock',
            header: 'Stock',
            accessor: (product) => (
                <span className={product.isInStock ? 'text-gray-700 dark:text-gray-200' : 'text-red-500'}>
                    {product.stockQty}
                </span>
            ),
            align: 'center',
        },
        {
            id: 'status',
            header: 'Status',
            accessor: (product) => (
                <span className="text-sm font-bold text-blue-600 dark:text-blue-600">
                    {product.isActive ? 'Active' : 'Inactive'}
                </span>
            ),
            sortable: true,
            sortKey: 'isActive',
        },
        {
            id: 'rating',
            header: 'Rating',
            accessor: (product) => (product.averageRating ? product.averageRating.toFixed(1) : '—'),
            align: 'center',
        },
        {
            id: 'updatedAt',
            header: 'Updated',
            accessor: (product) => new Date(product.updatedAt).toLocaleDateString(),
            sortable: true,
            sortKey: 'updatedAt',
        },
    ];

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Products</h2>
                        {typeof totalCount === 'number' && (
                            <p className="text-sm text-gray-400">{totalCount} total</p>
                        )}
                    </div>

                    {canCreate && (
                        <button
                            type="button"
                            onClick={onAddClick}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            Add Product
                        </button>
                    )}
                </div>

                <DataTable
                    data={products}
                    columns={columns}
                    getRowId={(product) => product.id}
                    searchPlaceholder="Search products"
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
                    errorMessage="Failed to load products."
                    onRetry={onRetry}
                    emptyMessage="No products yet — add your first one to get started."
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
                onClose={() => setDeleteModal({ isOpen: false, product: null, isBatch: false })}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
                title={deleteModal.isBatch ? 'Delete Selected Products' : 'Delete Product'}
                itemName={deleteModal.isBatch ? `${deleteModal.count} product${deleteModal.count === 1 ? '' : 's'}` : deleteModal.product?.name}
                message={deleteModal.isBatch
                    ? `Are you sure you want to delete ${deleteModal.count} selected product${deleteModal.count === 1 ? '' : 's'}? This action cannot be undone.`
                    : undefined}
                confirmText={deleteModal.isBatch ? `Delete ${deleteModal.count} Items` : 'Delete'}
            />
        </>
    );
}