// src/features/roles/components/RoleView.tsx
'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftIcon, CheckIcon, PencilSquareIcon, ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { PermissionMatrix } from './PermissionMatrix';
import { Role, PermissionCatalog } from '@/types/user-management.types';

interface RoleViewProps {
    role: Role;
    catalog?: PermissionCatalog;
    onBack: () => void;
    onUpdate: (input: { name?: string; description?: string }) => void;
    onSavePermissions: (permissionIds: string[]) => void;
    onViewUser?: (userId: string) => void;
    isUpdating?: boolean;
    isSavingPermissions?: boolean;
}

const inputClass =
    'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500';

export function RoleView({
    role,
    catalog,
    onBack,
    onUpdate,
    onSavePermissions,
    onViewUser,
    isUpdating = false,
    isSavingPermissions = false,
}: RoleViewProps) {
    const { can } = usePermissions();
    const canUpdate = can({ permission: 'role:update' });

    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [name, setName] = useState(role.name);
    const [description, setDescription] = useState(role.description ?? '');
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

    // Re-sync local state whenever the role is refetched (e.g. after a save).
    useEffect(() => {
        setName(role.name);
        setDescription(role.description ?? '');
        setSelectedPermissionIds((role.permissions ?? []).map((p) => p.id));
    }, [role]);

    const assignedIds = (role.permissions ?? []).map((p) => p.id);
    const permissionsDirty =
        selectedPermissionIds.length !== assignedIds.length ||
        selectedPermissionIds.some((id) => !assignedIds.includes(id));

    const handleInfoSave = () => {
        onUpdate({ name: name.trim(), description: description.trim() });
        setIsEditingInfo(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back
                    </button>
                    <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
                    <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center shrink-0">
                        <ShieldCheckIcon className="w-5 h-5" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{role.name}</h1>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {role.isSystem ? 'Built-in' : 'Custom'}
                    </span>
                </div>
            </div>

            {/* Role info */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Role Details
                    </h3>
                    {canUpdate && !isEditingInfo && (
                        <button
                            onClick={() => setIsEditingInfo(true)}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            <PencilSquareIcon className="w-4 h-4" />
                            Edit
                        </button>
                    )}
                </div>

                {isEditingInfo ? (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
                            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Description
                            </label>
                            <input
                                className={inputClass}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setName(role.name);
                                    setDescription(role.description ?? '');
                                    setIsEditingInfo(false);
                                }}
                                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleInfoSave}
                                disabled={isUpdating}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {isUpdating ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{role.description || 'No description.'}</p>
                        <p className="text-xs text-gray-400">
                            {role.permissions?.length ?? 0} permissions · {role.users?.length ?? role.userCount ?? 0} users
                        </p>
                    </div>
                )}
            </div>

            {/* Permission builder */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Permissions
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {selectedPermissionIds.length} of {catalog?.permissions.length ?? 0} selected
                        </p>
                    </div>
                    {canUpdate && (
                        <div className="flex items-center gap-2">
                            {permissionsDirty && (
                                <button
                                    onClick={() => setSelectedPermissionIds(assignedIds)}
                                    className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Reset
                                </button>
                            )}
                            <button
                                onClick={() => onSavePermissions(selectedPermissionIds)}
                                disabled={!permissionsDirty || isSavingPermissions}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <CheckIcon className="w-4 h-4" />
                                {isSavingPermissions ? 'Saving...' : 'Save Permissions'}
                            </button>
                        </div>
                    )}
                </div>

                <PermissionMatrix
                    groups={catalog?.grouped ?? []}
                    selectedIds={selectedPermissionIds}
                    onChange={setSelectedPermissionIds}
                    readOnly={!canUpdate}
                />

                {canUpdate && (
                    <p className="mt-4 text-xs text-gray-400">
                        Permission changes take effect the next time an affected user signs in or refreshes their session —
                        roles and permissions are baked into the access token when it&apos;s issued.
                    </p>
                )}
            </div>

            {/* Users with this role */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                    Users with this role ({role.users?.length ?? 0})
                </h3>

                {!role.users || role.users.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">No users assigned to this role.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {role.users.map((user) => (
                            <button
                                key={user.id}
                                onClick={onViewUser ? () => onViewUser(user.id) : undefined}
                                className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">
                                    <UserIcon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                                        {user.firstname} {user.lastName}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
