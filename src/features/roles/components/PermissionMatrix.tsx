// src/features/roles/components/PermissionMatrix.tsx
'use client';

import { PermissionGroup } from '@/types/user-management.types';

interface PermissionMatrixProps {
    groups: PermissionGroup[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    readOnly?: boolean;
}

function titleCase(s: string) {
    return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PermissionMatrix({ groups, selectedIds, onChange, readOnly = false }: PermissionMatrixProps) {
    const toggle = (id: string) => {
        if (readOnly) return;
        onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
    };

    const toggleGroup = (group: PermissionGroup) => {
        if (readOnly) return;
        const groupIds = group.permissions.map((p) => p.id);
        const allSelected = groupIds.every((id) => selectedIds.includes(id));
        if (allSelected) {
            onChange(selectedIds.filter((id) => !groupIds.includes(id)));
        } else {
            onChange(Array.from(new Set([...selectedIds, ...groupIds])));
        }
    };

    return (
        <div className="space-y-3">
            {groups.map((group) => {
                const groupIds = group.permissions.map((p) => p.id);
                const allSelected = groupIds.length > 0 && groupIds.every((id) => selectedIds.includes(id));
                const someSelected = groupIds.some((id) => selectedIds.includes(id));

                return (
                    <div key={group.resource} className="rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                        <div className="flex items-center justify-between mb-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer">
                                {!readOnly && (
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => {
                                            if (el) el.indeterminate = !allSelected && someSelected;
                                        }}
                                        onChange={() => toggleGroup(group)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                )}
                                {titleCase(group.resource)}
                            </label>
                            <span className="text-xs text-gray-400">
                                {groupIds.filter((id) => selectedIds.includes(id)).length}/{groupIds.length}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {group.permissions.map((perm) => (
                                <label
                                    key={perm.id}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${readOnly ? 'cursor-default' : 'cursor-pointer'
                                        } ${selectedIds.includes(perm.id)
                                            ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                                        }`}
                                >
                                    {!readOnly && (
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={selectedIds.includes(perm.id)}
                                            onChange={() => toggle(perm.id)}
                                        />
                                    )}
                                    {perm.action}
                                </label>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
