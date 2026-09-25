// src/features/roles/components/RoleFormModal.tsx
'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { usePermissionCatalog } from '../hooks/useRoles';
import { PermissionMatrix } from './PermissionMatrix';
import { CreateRolePayload } from '@/types/user-management.types';

interface RoleFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (input: CreateRolePayload) => void;
    isSubmitting?: boolean;
    errorMessage?: string | null;
}

const inputClass =
    'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500';

export function RoleFormModal({ isOpen, onClose, onSubmit, isSubmitting = false, errorMessage }: RoleFormModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

    const { data: catalog } = usePermissionCatalog();

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setDescription('');
            setSelectedPermissionIds([]);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name: name.trim(),
            description: description.trim() || undefined,
            permissionIds: selectedPermissionIds.length > 0 ? selectedPermissionIds : undefined,
        });
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
                            <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 dark:text-white">
                                    Create Role
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                    {errorMessage && (
                                        <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            Role name
                                        </label>
                                        <input
                                            required
                                            minLength={2}
                                            maxLength={50}
                                            className={inputClass}
                                            placeholder="e.g. warehouse_lead"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            Description (optional)
                                        </label>
                                        <input
                                            maxLength={255}
                                            className={inputClass}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                            Permissions
                                        </label>
                                        <div className="max-h-80 overflow-y-auto pr-1">
                                            <PermissionMatrix
                                                groups={catalog?.grouped ?? []}
                                                selectedIds={selectedPermissionIds}
                                                onChange={setSelectedPermissionIds}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 justify-end pt-2">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            disabled={isSubmitting}
                                            className="inline-flex justify-center rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="inline-flex justify-center rounded-xl border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Creating...' : 'Create Role'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
