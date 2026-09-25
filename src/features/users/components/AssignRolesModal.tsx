// src/features/users/components/AssignRolesModal.tsx
'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useRoles } from '@/features/roles/hooks/useRoles';
import { RoleRef } from '@/types/user-management.types';

interface AssignRolesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (roleIds: string[]) => void;
    currentRoles: RoleRef[];
    isSubmitting?: boolean;
}

export function AssignRolesModal({ isOpen, onClose, onSubmit, currentRoles, isSubmitting = false }: AssignRolesModalProps) {
    const { data: roles = [] } = useRoles();
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setSelectedRoleIds(currentRoles.map((r) => r.id));
        }
    }, [isOpen, currentRoles]);

    const toggleRole = (roleId: string) => {
        setSelectedRoleIds((prev) => (prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]));
    };

    const handleSubmit = () => {
        onSubmit(selectedRoleIds);
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 dark:text-white">
                                    Edit Roles
                                </Dialog.Title>

                                <div className="mt-4 space-y-2 max-h-72 overflow-y-auto">
                                    {roles.length === 0 ? (
                                        <p className="text-sm text-gray-400">No roles available.</p>
                                    ) : (
                                        roles.map((role) => (
                                            <label
                                                key={role.id}
                                                className="flex items-start gap-3 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRoleIds.includes(role.id)}
                                                    onChange={() => toggleRole(role.id)}
                                                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{role.name}</p>
                                                    {role.description && (
                                                        <p className="text-xs text-gray-400 truncate">{role.description}</p>
                                                    )}
                                                </div>
                                            </label>
                                        ))
                                    )}
                                </div>

                                <div className="mt-6 flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={isSubmitting}
                                        className="inline-flex justify-center rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="inline-flex justify-center rounded-xl border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save Roles'}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
