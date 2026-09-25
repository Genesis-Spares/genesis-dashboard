// src/features/users/components/tabs/UserRolesTab.tsx
'use client';

import { useState } from 'react';
import { PencilSquareIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { AssignRolesModal } from '../AssignRolesModal';
import { RoleRef } from '@/types/user-management.types';

interface UserRolesTabProps {
    roles: RoleRef[];
    canManage: boolean;
    onAssignRoles: (roleIds: string[]) => void;
    isAssigning?: boolean;
}

export function UserRolesTab({ roles, canManage, onAssignRoles, isAssigning = false }: UserRolesTabProps) {
    const [modalOpen, setModalOpen] = useState(false);

    const handleSubmit = (roleIds: string[]) => {
        onAssignRoles(roleIds);
        setModalOpen(false);
    };

    return (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Assigned Roles
                </h3>
                {canManage && (
                    <button
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        <PencilSquareIcon className="w-4 h-4" />
                        Edit Roles
                    </button>
                )}
            </div>

            {roles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-3">
                        <ShieldCheckIcon className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No roles assigned</p>
                    <p className="text-xs text-gray-400 mt-1">This user has no permissions until a role is assigned.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800"
                        >
                            <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center shrink-0">
                                <ShieldCheckIcon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{role.name}</p>
                                {role.description && <p className="text-xs text-gray-400 truncate">{role.description}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AssignRolesModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                currentRoles={roles}
                isSubmitting={isAssigning}
            />
        </div>
    );
}
