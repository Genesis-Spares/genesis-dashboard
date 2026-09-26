// src/components/common/DataTable.tsx
'use client';

import { useMemo, useState, type ReactNode, useEffect } from 'react';
import {
    PlusIcon,
    EllipsisHorizontalIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    TrashIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    ChevronUpDownIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    ArrowUpTrayIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { FilterBar, type FilterConfig, type FilterValue } from './FilterBar';

/**
 * A single tab/filter shown at the top of the table (e.g. "All Product (145)").
 */
export interface DataTableTab {
    id: string;
    label: string;
    count?: number;
}

/**
 * Column definition with sorting support
 */
export interface DataTableColumn<T> {
    id: string;
    header: string;
    accessor: (row: T) => ReactNode;
    align?: 'left' | 'center' | 'right';
    width?: string; // e.g. 'w-32'
    sortable?: boolean;
    sortKey?: string; // If different from id
    /**
     * How the column shows in the phone card layout (below md). Defaults: `actions` →
     * "actions", `image`/`avatar`/`icon` → "media", the first other column → "primary",
     * everything else → "field" (label + value).
     */
    mobile?: 'primary' | 'media' | 'actions' | 'field' | 'hidden';
}

type MobileRole = NonNullable<DataTableColumn<unknown>['mobile']>;

function mobileRoles<T>(columns: DataTableColumn<T>[]): Map<string, MobileRole> {
    const roles = new Map<string, MobileRole>();
    let hasPrimary = columns.some((c) => c.mobile === 'primary');
    for (const col of columns) {
        let role: MobileRole | undefined = col.mobile;
        if (!role) {
            if (col.id === 'actions') role = 'actions';
            else if (['image', 'avatar', 'icon'].includes(col.id)) role = 'media';
            else if (!hasPrimary) {
                role = 'primary';
                hasPrimary = true;
            } else role = 'field';
        }
        roles.set(col.id, role);
    }
    return roles;
}

export interface DataTableAction<T> {
    label: string;
    icon: ReactNode;
    onClick: (row: T) => void;
    className?: string;
}

export interface SortConfig {
    key: string;
    direction: 'asc' | 'desc';
}

export interface BatchAction {
    label: string;
    icon: ReactNode;
    onClick: (selectedIds: string[]) => void;
    variant?: 'danger' | 'primary' | 'default';
    disabled?: boolean;
}

interface DataTableProps<T> {
    /** Row data for the current page */
    data: T[];
    /** Column definitions */
    columns: DataTableColumn<T>[];
    /** Unique key extractor for each row */
    getRowId: (row: T) => string;

    /** Tabs shown top-left (optional — omit to hide) */
    tabs?: DataTableTab[];
    activeTab?: string;
    onTabChange?: (tabId: string) => void;

    /** Filter configuration */
    filterConfigs?: FilterConfig[];
    filterValues?: Record<string, FilterValue>;
    onFilterChange?: (key: string, value: FilterValue) => void;

    /** Search box (optional — omit to hide) */
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;

    /** Toolbar buttons (optional) */
    onAddClick?: () => void;
    onMoreClick?: () => void;
    onExportClick?: () => void;
    batchActions?: BatchAction[];

    /** Sorting */
    sortConfig?: SortConfig | null;
    onSortChange?: (sort: SortConfig | null) => void;

    /** Row selection (optional — omit to hide checkbox column) */
    selectable?: boolean;
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;

    /** Row-level actions rendered in a trailing "Action" column */
    rowActions?: DataTableAction<T>[];

    /** Pagination (optional — omit to hide) */
    page?: number;
    pageCount?: number;
    onPageChange?: (page: number) => void;

    isLoading?: boolean;
    emptyMessage?: string;
    showFilterBar?: boolean;

    isExporting?: boolean;

    /** Data failed to load — table shell (toolbar/filters) still renders; rows are replaced with an error + reload prompt. */
    isError?: boolean;
    errorMessage?: string;
    onRetry?: () => void;
}

/** Builds the compact page list: 1 2 3 4 5 … 24 */
function buildPageList(current: number, total: number): (number | 'ellipsis')[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = new Set<number>([1, 2, 3, 4, 5, total]);
    pages.add(current);
    pages.add(Math.max(1, current - 1));
    pages.add(Math.min(total, current + 1));

    const sorted = Array.from(pages)
        .filter((p) => p >= 1 && p <= total)
        .sort((a, b) => a - b);

    const result: (number | 'ellipsis')[] = [];
    sorted.forEach((p, i) => {
        if (i > 0 && p - sorted[i - 1] > 1) {
            result.push('ellipsis');
        }
        result.push(p);
    });

    return result;
}

export function DataTable<T>({
    data,
    columns,
    getRowId,
    tabs,
    activeTab,
    onTabChange,
    filterConfigs = [],
    filterValues = {},
    onFilterChange,
    searchPlaceholder = 'Search...',
    searchValue,
    onSearchChange,
    onAddClick,
    onMoreClick,
    onExportClick,
    batchActions = [],
    sortConfig,
    onSortChange,
    selectable = false,
    selectedIds = [],
    onSelectionChange,
    rowActions,
    page = 1,
    pageCount = 1,
    onPageChange,
    isLoading = false,
    emptyMessage = 'No records found.',
    showFilterBar = true,
    isExporting = true,
    isError = false,
    errorMessage = 'Failed to load data.',
    onRetry,
}: DataTableProps<T>) {
    const [internalSearch, setInternalSearch] = useState('');
    const search = searchValue ?? internalSearch;

    const allSelected = data.length > 0 && selectedIds.length === data.length;
    const someSelected = selectedIds.length > 0 && !allSelected;

    const pageList = useMemo(() => buildPageList(page, pageCount), [page, pageCount]);
    const roles = useMemo(() => mobileRoles(columns), [columns]);
    const sortableColumns = columns.filter((c) => c.sortable);

    const toggleAll = () => {
        if (!onSelectionChange) return;
        onSelectionChange(allSelected ? [] : data.map(getRowId));
    };

    const toggleRow = (id: string) => {
        if (!onSelectionChange) return;
        onSelectionChange(
            selectedIds.includes(id)
                ? selectedIds.filter((sid) => sid !== id)
                : [...selectedIds, id]
        );
    };

    const alignClass = (align?: 'left' | 'center' | 'right') =>
        align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

    const handleSort = (column: DataTableColumn<T>) => {
        if (!onSortChange || !column.sortable) return;

        const sortKey = column.sortKey || column.id;
        if (sortConfig?.key === sortKey) {
            if (sortConfig.direction === 'asc') {
                onSortChange({ key: sortKey, direction: 'desc' });
            } else {
                onSortChange(null);
            }
        } else {
            onSortChange({ key: sortKey, direction: 'asc' });
        }
    };

    const getSortIcon = (column: DataTableColumn<T>) => {
        if (!column.sortable) return null;

        const sortKey = column.sortKey || column.id;
        if (sortConfig?.key === sortKey) {
            return sortConfig.direction === 'asc'
                ? <ChevronUpIcon className="w-4 h-4" />
                : <ChevronDownIcon className="w-4 h-4" />;
        }
        return <ChevronUpDownIcon className="w-4 h-4 opacity-40" />;
    };

    const hasFilters = filterConfigs.length > 0;
    const hasSearch = onSearchChange || searchValue !== undefined;
    const hasBatchActions = batchActions.length > 0 && selectedIds.length > 0;

    // Export handler with current data
    const handleExport = () => {
        if (onExportClick) {
            onExportClick();
        } else {
            // Default export as CSV
            const headers = columns.map(col => col.header).join(',');
            const rows = data.map(row =>
                columns.map(col => {
                    const value = col.accessor(row);
                    // Handle React elements for export
                    if (typeof value === 'string' || typeof value === 'number') {
                        return String(value);
                    }
                    // For complex values, try to extract text
                    if (value && typeof value === 'object') {
                        // Try to get text content from React elements
                        return '';
                    }
                    return '';
                }).join(',')
            );

            const csv = [headers, ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'export.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
            {/* Toolbar: tabs + search + actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
                {tabs && tabs.length > 0 ? (
                    <div className="-mx-1 flex max-w-full items-center gap-1 overflow-x-auto px-1 bg-white dark:bg-gray-800">
                        {tabs.map((tab) => {
                            const isActive = tab.id === activeTab;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange?.(tab.id)}
                                    className={`shrink-0 whitespace-nowrap px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isActive
                                        ? 'bg-blue-50 text-gray-900 dark:bg-blue-900/20 dark:text-white'
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                        }`}
                                >
                                    {tab.label}
                                    {typeof tab.count === 'number' && (
                                        <span
                                            className={
                                                isActive
                                                    ? 'ml-1 text-blue-600 dark:text-blue-400'
                                                    : 'ml-1 text-gray-400'
                                            }
                                        >
                                            ({tab.count})
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="hidden sm:block" />
                )}

                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    {hasSearch && (
                        <div className="relative min-w-0 flex-1 sm:flex-none">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setInternalSearch(e.target.value);
                                    onSearchChange?.(e.target.value);
                                }}
                                placeholder={searchPlaceholder}
                                className="pl-9 pr-3 py-2 text-base sm:text-sm w-full sm:w-56 bg-gray-50 dark:bg-gray-700 rounded border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none transition-colors"
                            />
                        </div>
                    )}

                    {hasBatchActions && (
                        <div className="order-last flex w-full flex-wrap items-center gap-2 sm:order-none sm:w-auto">
                            {batchActions.map((action) => {
                                const variantClasses = {
                                    danger: 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
                                    primary: 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
                                    default: 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700',
                                };
                                const variantClass = action.variant ? variantClasses[action.variant] : variantClasses.default;

                                return (
                                    <button
                                        key={action.label}
                                        onClick={() => action.onClick(selectedIds)}
                                        disabled={action.disabled}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium transition-colors ${variantClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                                        aria-label={action.label}
                                    >
                                        {action.icon}
                                        <span>{action.label} ({selectedIds.length})</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}


                    {hasFilters && showFilterBar && onFilterChange && (
                        <FilterBar
                            filters={filterConfigs}
                            values={filterValues}
                            onChange={onFilterChange}
                        />
                    )}


                    {onExportClick && (
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="p-2.5 rounded border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Export"
                        >
                            {isExporting ? (
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                            ) : (
                                <ArrowUpTrayIcon className="w-4 h-4" />
                            )}
                        </button>
                    )}

                    {onAddClick && (
                        <button
                            onClick={onAddClick}
                            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Add"
                        >
                            <PlusIcon className="w-4 h-4" />
                        </button>
                    )}

                    {onMoreClick && (
                        <button
                            onClick={onMoreClick}
                            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            aria-label="More actions"
                        >
                            <EllipsisHorizontalIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Phone layout: one card per row (below md) */}
            <div className="md:hidden border-t border-gray-100 dark:border-gray-700">
                {(sortableColumns.length > 0 && onSortChange) || (selectable && data.length > 0) ? (
                    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-blue-50/60 dark:bg-blue-900/10">
                        {selectable && data.length > 0 ? (
                            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(el) => {
                                        if (el) el.indeterminate = someSelected;
                                    }}
                                    onChange={toggleAll}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                Select all
                            </label>
                        ) : (
                            <span />
                        )}
                        {sortableColumns.length > 0 && onSortChange && (
                            <label className="flex min-w-0 items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="shrink-0">Sort</span>
                                <select
                                    value={sortConfig ? `${sortConfig.key}:${sortConfig.direction}` : ''}
                                    onChange={(e) => {
                                        const [key, direction] = e.target.value.split(':');
                                        onSortChange(key ? { key, direction: direction as 'asc' | 'desc' } : null);
                                    }}
                                    className="min-w-0 max-w-[11rem] rounded border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                                >
                                    <option value="">Default</option>
                                    {sortableColumns.flatMap((c) => {
                                        const key = c.sortKey || c.id;
                                        return [
                                            <option key={`${key}:asc`} value={`${key}:asc`}>{c.header} ↑</option>,
                                            <option key={`${key}:desc`} value={`${key}:desc`}>{c.header} ↓</option>,
                                        ];
                                    })}
                                </select>
                            </label>
                        )}
                    </div>
                ) : null}

                {isError ? (
                    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                        <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
                        <p className="text-sm text-red-500 dark:text-red-400">{errorMessage}</p>
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                type="button"
                                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300"
                            >
                                <ArrowPathIcon className="w-4 h-4" />
                                Reload
                            </button>
                        )}
                    </div>
                ) : isLoading ? (
                    <p className="py-10 text-center text-sm text-gray-400">Loading...</p>
                ) : data.length === 0 ? (
                    <p className="px-4 py-10 text-center text-sm text-gray-400">{emptyMessage}</p>
                ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {data.map((row) => {
                            const id = getRowId(row);
                            const primary = columns.filter((c) => roles.get(c.id) === 'primary');
                            const media = columns.filter((c) => roles.get(c.id) === 'media');
                            const fields = columns.filter((c) => roles.get(c.id) === 'field');
                            const actionCols = columns.filter((c) => roles.get(c.id) === 'actions');
                            const hasActions = actionCols.length > 0 || (rowActions && rowActions.length > 0);
                            return (
                                <li key={id} className="flex gap-3 px-4 py-3">
                                    {selectable && (
                                        <input
                                            type="checkbox"
                                            aria-label="Select row"
                                            checked={selectedIds.includes(id)}
                                            onChange={() => toggleRow(id)}
                                            className="mt-1 w-4 h-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    )}
                                    {media.map((c) => (
                                        <div key={c.id} className="shrink-0">{c.accessor(row)}</div>
                                    ))}
                                    <div className="min-w-0 flex-1">
                                        {primary.map((c) => (
                                            <div key={c.id} className="min-w-0 break-words text-sm font-medium text-gray-900 dark:text-white">
                                                {c.accessor(row)}
                                            </div>
                                        ))}
                                        {fields.length > 0 && (
                                            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                                                {fields.map((c) => (
                                                    <div key={c.id} className="min-w-0">
                                                        <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{c.header}</dt>
                                                        <dd className="mt-0.5 min-w-0 break-words text-sm text-gray-700 dark:text-gray-200">{c.accessor(row)}</dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        )}
                                        {hasActions && (
                                            <div className="mt-2 flex flex-wrap items-center justify-end gap-3 border-t border-gray-50 pt-2 dark:border-gray-700/60">
                                                {actionCols.map((c) => (
                                                    <div key={c.id}>{c.accessor(row)}</div>
                                                ))}
                                                {rowActions?.map((action) => (
                                                    <button
                                                        key={action.label}
                                                        onClick={() => action.onClick(row)}
                                                        aria-label={action.label}
                                                        className={`p-1.5 ${action.className ?? 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                                                        type="button"
                                                    >
                                                        {action.icon}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Table (md and up) */}
            <div className="relative hidden overflow-x-auto md:block">
                <table className="w-full">
                    <thead>
                        <tr className="bg-blue-50/60 dark:bg-blue-900/10">
                            {selectable && (
                                <th className="w-12 py-2 pl-6 pr-2">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => {
                                            if (el) el.indeterminate = someSelected;
                                        }}
                                        onChange={toggleAll}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                            )}
                            {columns.map((col) => (
                                <th
                                    key={col.id}
                                    className={`py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-200 ${alignClass(col.align)
                                        } ${col.width ?? ''}`}
                                >
                                    <button
                                        onClick={() => handleSort(col)}
                                        className={`flex items-center gap-1 hover:text-gray-900 dark:hover:text-white ${col.sortable ? 'cursor-pointer' : 'cursor-default'
                                            } ${col.align === 'center' ? 'justify-center' :
                                                col.align === 'right' ? 'justify-end' : 'justify-start'
                                            } w-full`}
                                        disabled={!col.sortable}
                                        type="button"
                                    >
                                        {col.header}
                                        {col.sortable && getSortIcon(col)}
                                    </button>
                                </th>
                            ))}
                            {rowActions && rowActions.length > 0 && (
                                <th className="py-2 pr-6 pl-3 text-sm font-medium text-gray-700 dark:text-gray-200 text-right">
                                    Action
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {isError ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                                    className="py-10"
                                >
                                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                                        <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
                                        <p className="text-sm text-red-500 dark:text-red-400">{errorMessage}</p>
                                        {onRetry && (
                                            <button
                                                onClick={onRetry}
                                                type="button"
                                                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <ArrowPathIcon className="w-4 h-4" />
                                                Reload
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : isLoading ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                                    className="py-10 text-center text-sm text-gray-400"
                                >
                                    Loading...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                                    className="py-10 text-center text-sm text-gray-400"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row) => {
                                const id = getRowId(row);
                                return (
                                    <tr
                                        key={id}
                                        className="hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors"
                                    >
                                        {selectable && (
                                            <td className="py-2 pl-6 pr-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(id)}
                                                    onChange={() => toggleRow(id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                        )}
                                        {columns.map((col) => (
                                            <td
                                                key={col.id}
                                                className={`py-2 px-3 text-sm text-gray-700 dark:text-gray-200 ${alignClass(col.align)
                                                    }`}
                                            >
                                                {col.accessor(row)}
                                            </td>
                                        ))}
                                        {rowActions && rowActions.length > 0 && (
                                            <td className="py-2 pr-6 pl-3">
                                                <div className="flex items-center justify-end gap-3">
                                                    {rowActions.map((action) => (
                                                        <button
                                                            key={action.label}
                                                            onClick={() => action.onClick(row)}
                                                            aria-label={action.label}
                                                            className={
                                                                action.className ??
                                                                'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                                            }
                                                            type="button"
                                                        >
                                                            {action.icon}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {onPageChange && pageCount > 0 && !isError && (
                <div className="flex items-center justify-between gap-2 p-3 sm:gap-3 sm:p-4">
                    <button
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        aria-label="Previous page"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        type="button"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Previous</span>
                    </button>

                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {pageList.map((p, i) =>
                            p === 'ellipsis' ? (
                                <span
                                    key={`ellipsis-${i}`}
                                    className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm"
                                >
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={p}
                                    onClick={() => onPageChange(p)}
                                    className={`w-9 h-9 rounded text-sm font-medium border transition-colors ${p === page
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                    type="button"
                                >
                                    {p}
                                </button>
                            )
                        )}
                    </div>

                    <button
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= pageCount}
                        aria-label="Next page"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        type="button"
                    >
                        <span className="hidden sm:inline">Next</span>
                        <ArrowRightIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

/** Ready-made edit/delete action pair for the common case. */
export const editDeleteActions = <T,>(
    onEdit: (row: T) => void,
    onDelete: (row: T) => void
): DataTableAction<T>[] => [
        {
            label: 'Edit',
            icon: <PencilSquareIcon className="w-4 h-4" />,
            onClick: onEdit,
        },
        {
            label: 'Delete',
            icon: <TrashIcon className="w-4 h-4" />,
            onClick: onDelete,
            className: 'text-gray-400 hover:text-red-500',
        },
    ];