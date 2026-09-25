// src/components/ui/data-table/FilterBar.tsx
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';

export type FilterValue = string | number | boolean | null | undefined;

export interface FilterOption {
    value: string;
    label: string;
}

export interface FilterConfig {
    key: string;
    label: string;
    type: 'select' | 'date' | 'number' | 'text' | 'checkbox';
    options?: FilterOption[];
    placeholder?: string;
}

interface FilterBarProps {
    filters: FilterConfig[];
    values: Record<string, FilterValue>;
    onChange: (key: string, value: FilterValue) => void;
    className?: string;
    iconClassName?: string;
}

export function FilterBar({
    filters,
    values,
    onChange,
    className = '',
    iconClassName = ''
}: FilterBarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    const hasActiveFilters = useMemo(() => {
        return filters.some(filter => {
            const val = values[filter.key];
            if (filter.type === 'select' || filter.type === 'checkbox') {
                return val !== undefined && val !== null && val !== '' && val !== 'all' && val !== false;
            }
            return val !== undefined && val !== null && val !== '';
        });
    }, [filters, values]);

    const activeFilterCount = useMemo(() => {
        return filters.filter(filter => {
            const val = values[filter.key];
            if (filter.type === 'select') {
                return val !== undefined && val !== null && val !== '' && val !== 'all';
            }
            if (filter.type === 'checkbox') {
                return val === true;
            }
            return val !== undefined && val !== null && val !== '';
        }).length;
    }, [filters, values]);

    const clearAllFilters = () => {
        filters.forEach(filter => {
            onChange(filter.key, filter.type === 'select' ? 'all' : filter.type === 'checkbox' ? false : '');
        });
    };

    const clearFilter = (key: string) => {
        const filter = filters.find(f => f.key === key);
        if (filter) {
            onChange(key, filter.type === 'select' ? 'all' : filter.type === 'checkbox' ? false : '');
        }
    };

    const togglePopup = () => {
        if (!isOpen) {
            updatePosition();
        }
        setIsOpen(!isOpen);
    };

    const updatePosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 8,
                left: rect.right - 320 + window.scrollX,
            });
        }
    };

    // Close popup on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popupRef.current &&
                !popupRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
            // Update position on scroll/resize
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    const renderFilterInput = (filter: FilterConfig) => {
        const value = values[filter.key] ??
            (filter.type === 'select' ? 'all' : filter.type === 'checkbox' ? false : '');

        switch (filter.type) {
            case 'select':
                return (
                    <select
                        value={value as string}
                        onChange={(e) => onChange(filter.key, e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    >
                        <option value="all">All</option>
                        {filter.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                );

            case 'checkbox':
                return (
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={value as boolean}
                            onChange={(e) => onChange(filter.key, e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            {filter.placeholder || `Show ${filter.label}`}
                        </span>
                    </div>
                );

            case 'date':
                return (
                    <input
                        type="date"
                        value={value as string}
                        onChange={(e) => onChange(filter.key, e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder={filter.placeholder || 'Select date'}
                    />
                );

            case 'number':
                return (
                    <input
                        type="number"
                        value={value as string}
                        onChange={(e) => onChange(filter.key, e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder={filter.placeholder || 'Enter number'}
                    />
                );

            case 'text':
            default:
                return (
                    <input
                        type="text"
                        value={value as string}
                        onChange={(e) => onChange(filter.key, e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder={filter.placeholder || `Filter by ${filter.label}`}
                    />
                );
        }
    };

    const isFilterActive = (filter: FilterConfig) => {
        const val = values[filter.key];
        if (filter.type === 'select') {
            return val !== undefined && val !== null && val !== '' && val !== 'all';
        }
        if (filter.type === 'checkbox') {
            return val === true;
        }
        return val !== undefined && val !== null && val !== '';
    };

    return (
        <div className={`relative inline-block ${className}`}>
            <button
                ref={buttonRef}
                onClick={togglePopup}
                className={`relative p-2.5 rounded border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${iconClassName}`}
                aria-label="Filter"
            >
                <FunnelIcon className="w-4 h-4" />
                {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-medium flex items-center justify-center">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {isOpen && createPortal(
                <div
                    ref={popupRef}
                    className="fixed z-50 w-80 bg-white dark:bg-gray-800 rounded shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                    style={{
                        top: position.top,
                        left: position.left,
                        maxHeight: 'calc(100vh - 100px)',
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Filters</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>

                    {/* Filter List */}
                    <div className="p-4 space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto">
                        {filters.map((filter) => {
                            const active = isFilterActive(filter);
                            return (
                                <div key={filter.key} className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                            {filter.label}
                                        </label>
                                        {active && (
                                            <button
                                                onClick={() => clearFilter(filter.key)}
                                                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    {renderFilterInput(filter)}
                                </div>
                            );
                        })}

                        {/* Empty state */}
                        {filters.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-sm text-gray-400">No filters available</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {hasActiveFilters && (
                        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <button
                                onClick={clearAllFilters}
                                className="w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
}