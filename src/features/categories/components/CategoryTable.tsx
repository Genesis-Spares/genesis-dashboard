// src/features/categories/components/CategoryTable.tsx
'use client';

import { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { DataTable, type DataTableColumn, type SortConfig, type BatchAction } from '@/components/common/DataTable';
import { type FilterConfig, type FilterValue } from '@/components/common/FilterBar';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { TableActions, createStatusActions } from '@/components/common/TableActions';
import { Category } from '@/types/category.types';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { usePermissions } from '@/lib/hooks/usePermissions';

function getCategoryIcon(iconName?: string | null): LucideIcon | null {
    if (!iconName) return null;

    const directIcon = LucideIcons[iconName as keyof typeof LucideIcons];
    if (typeof directIcon === 'function' || (typeof directIcon === 'object' && directIcon !== null)) {
        return directIcon as unknown as LucideIcon;
    }

    // Try normalized name (e.g., "smartphone" -> "Smartphone")
    const normalizedName = iconName
        .split(/[-_\s]+/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');

    const normalizedIcon = LucideIcons[normalizedName as keyof typeof LucideIcons];
    if (typeof normalizedIcon === 'function' || (typeof normalizedIcon === 'object' && normalizedIcon !== null)) {
        return normalizedIcon as unknown as LucideIcon;
    }

    return null;
}

interface FlatCategoryRow {
    category: Category;
    level: number;
}

function flattenCategories(categories: Category[], level = 0): FlatCategoryRow[] {
    return categories.map((category) => ({ category, level }));
}

export type StatusFilter = 'all' | 'active' | 'inactive';

interface CategoryTableProps {
    categories: Category[];
    isLoading?: boolean;
    isError?: boolean;
    onRetry?: () => void;
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
    onView?: (category: Category) => void;
    onStatusChange?: (category: Category, isActive: boolean) => void;
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
    parentFilter?: string | null;
    onParentFilterChange?: (parentId: string | null) => void;
    dateFrom?: string;
    onDateFromChange?: (value: string) => void;
    dateTo?: string;
    onDateToChange?: (value: string) => void;
    sortConfig?: SortConfig | null;
    onSortChange?: (sort: SortConfig | null) => void;
}

export function CategoryTable({
    categories,
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
    parentFilter = null,
    onParentFilterChange,
    dateFrom = '',
    onDateFromChange,
    dateTo = '',
    onDateToChange,
    sortConfig,
    onSortChange,
}: CategoryTableProps) {
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        category: Category | null;
        isBatch: boolean;
        count?: number;
    }>({
        isOpen: false,
        category: null,
        isBatch: false,
    });

    const { can } = usePermissions();

    const canCreate = can({ permission: 'category:create' });
    const canEdit = can({ permission: 'category:update' });
    const canDelete = can({ permission: 'category:delete' });
    const canExport = can({ permission: ['category:read', 'category:export'] });

    const rows = flattenCategories(categories);

    const allParentOptions = categories
        .filter(cat => cat.parentId === null)
        .map((category) => ({ id: category.id, name: category.name }));

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
        ...(onParentFilterChange ? [{
            key: 'parent',
            label: 'Parent Category',
            type: 'select' as const,
            options: allParentOptions.map(opt => ({ value: opt.id, label: opt.name })),
        }] : []),
        ...(onDateFromChange ? [{
            key: 'dateFrom',
            label: 'Created From',
            type: 'date' as const,
            placeholder: 'From date',
        }] : []),
        ...(onDateToChange ? [{
            key: 'dateTo',
            label: 'Created To',
            type: 'date' as const,
            placeholder: 'To date',
        }] : []),
    ];

    const filterValues: Record<string, FilterValue> = {};
    if (onStatusFilterChange) filterValues.status = statusFilter;
    if (onParentFilterChange) filterValues.parent = parentFilter || 'all';
    if (onDateFromChange) filterValues.dateFrom = dateFrom || '';
    if (onDateToChange) filterValues.dateTo = dateTo || '';

    const handleFilterChange = (key: string, value: FilterValue) => {
        switch (key) {
            case 'status':
                onStatusFilterChange?.(value as StatusFilter);
                break;
            case 'parent':
                onParentFilterChange?.(value === 'all' ? null : value as string);
                break;
            case 'dateFrom':
                onDateFromChange?.(value as string);
                break;
            case 'dateTo':
                onDateToChange?.(value as string);
                break;
        }
    };

    const handleDeleteClick = (category: Category) => {
        setDeleteModal({
            isOpen: true,
            category,
            isBatch: false,
        });
    };

    const handleBatchDeleteClick = (ids: string[]) => {
        setDeleteModal({
            isOpen: true,
            category: null,
            isBatch: true,
            count: ids.length,
        });
    };

    const handleConfirmDelete = () => {
        if (deleteModal.isBatch) {
            onDeleteSelected?.(selectedIds);
        } else if (deleteModal.category) {
            onDelete(deleteModal.category);
        }
        setDeleteModal({ isOpen: false, category: null, isBatch: false });
    };

    const batchActions: BatchAction[] = (onDeleteSelected && canDelete) ? [
        {
            label: 'Delete Selected',
            icon: <TrashIcon className="w-4 h-4" />,
            onClick: () => handleBatchDeleteClick(selectedIds),
            variant: 'danger',
        },
    ] : [];

    const columns: DataTableColumn<FlatCategoryRow>[] = [
        {
            id: 'actions',
            header: 'Actions',
            accessor: ({ category }) => {
                const statusActions = (onStatusChange && canEdit) ? createStatusActions(
                    () => onStatusChange(category, true),
                    () => onStatusChange(category, false)
                ) : [];

                return (
                    <TableActions
                        onView={onView ? () => onView(category) : undefined}
                        onEdit={canEdit ? () => onEdit(category) : undefined}
                        onDelete={canDelete ? () => handleDeleteClick(category) : undefined}
                        secondaryActions={statusActions}
                        size="md"
                    />
                );
            },
            align: 'left',
        },
        {
            id: 'name',
            header: 'Name',
            accessor: ({ category, level }) => (
                <div className="relative group inline-block max-w-full" style={{ paddingLeft: level * 24 }}>
                    <button
                        onClick={onView ? () => onView(category) : undefined}
                        className="font-medium text-gray-800 dark:text-gray-100 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                    >
                        {category.name}
                    </button>
                    <p className="text-xs text-gray-400 truncate">/{category.slug}</p>
                </div>
            ),
            sortable: true,
            sortKey: 'name',
        },

        {
            id: 'icon',
            header: 'Icon',
            accessor: ({ category }) => {
                const Icon = getCategoryIcon(category.icon);
                return (
                    <div className="flex items-center">
                        {Icon ? (
                            <div className="">
                                <Icon className="h-4 w-4" />
                            </div>
                        ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                                <span className="text-xs font-medium">
                                    {category.icon?.[0]?.toUpperCase() ?? '?'}
                                </span>
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            id: 'products',
            header: 'Products',
            accessor: ({ category }) => category.productsCount ?? 0,
            align: 'center',
            sortable: true,
            sortKey: 'productsCount',
        },
        {
            id: 'status',
            header: 'Status',
            accessor: ({ category }) => (
                <span
                    className={`text-sm font-bold text-blue-600 dark:text-blue-600`}
                >
                    {category.isActive ? 'Active' : 'Inactive'}
                </span>
            ),
            sortable: true,
            sortKey: 'isActive',
        },

        {
            id: 'image',
            header: 'Image',
            accessor: ({ category }) => (
                <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                    {category.imageUrl ? (
                        <img
                            src={category.imageUrl}
                            alt=""
                            width={36}
                            height={36}
                            className="object-cover"
                        />
                    ) : (
                        <span className="text-xs text-gray-400">{category.icon?.[0] ?? '?'}</span>
                    )}
                </div>
            ),
        },

        {
            id: 'children',
            header: 'Sub-Categories',
            accessor: ({ category }) => category.children?.length ?? 0,
            align: 'center',
            sortable: true,
            sortKey: 'childrenCount',
        },

        {
            id: 'parent',
            header: 'Parent',
            accessor: ({ category }) => category.parent?.name ?? '—',
            sortable: true,
            sortKey: 'parent.name',
        },
        {
            id: 'updatedAt',
            header: 'Updated',
            accessor: ({ category }) => new Date(category.updatedAt).toLocaleDateString(),
            sortable: true,
            sortKey: 'updatedAt',
        },
        {
            id: 'createdAt',
            header: 'Created',
            accessor: ({ category }) => new Date(category.createdAt).toLocaleDateString(),
            sortable: true,
            sortKey: 'createdAt',
        },
    ];

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Categories</h2>
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
                            Add Category
                        </button>
                    )}
                </div>

                <DataTable
                    data={rows}
                    columns={columns}
                    getRowId={(row) => row.category.id}
                    searchPlaceholder="Search categories"
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
                    errorMessage="Failed to load categories."
                    onRetry={onRetry}
                    emptyMessage="No categories yet — add your first one to get started."
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
                onClose={() => setDeleteModal({ isOpen: false, category: null, isBatch: false })}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
                title={deleteModal.isBatch ? 'Delete Selected Categories' : 'Delete Category'}
                itemName={deleteModal.isBatch ? `${deleteModal.count} categor${deleteModal.count === 1 ? 'y' : 'ies'}` : deleteModal.category?.name}
                message={deleteModal.isBatch
                    ? `Are you sure you want to delete ${deleteModal.count} selected categor${deleteModal.count === 1 ? 'y' : 'ies'} ? This action cannot be undone.`
                    : undefined}
                confirmText={deleteModal.isBatch ? `Delete ${deleteModal.count} Items` : 'Delete'}
            />
        </>
    );
}