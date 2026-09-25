// src/features/users/components/CreateUserModal.tsx
'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useRoles } from '@/features/roles/hooks/useRoles';
import { CreateUserPayload } from '@/types/user-management.types';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (input: CreateUserPayload) => void;
    isSubmitting?: boolean;
    errorMessage?: string | null;
}

const inputClass =
    'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500';

const emptyForm = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
};

export function CreateUserModal({ isOpen, onClose, onSubmit, isSubmitting = false, errorMessage }: CreateUserModalProps) {
    const [form, setForm] = useState(emptyForm);
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
    const [isActive, setIsActive] = useState(true);

    const { data: roles = [] } = useRoles();

    const resetAndClose = () => {
        setForm(emptyForm);
        setSelectedRoleIds([]);
        setIsActive(true);
        onClose();
    };

    const toggleRole = (roleId: string) => {
        setSelectedRoleIds((prev) => (prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            email: form.email,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone || undefined,
            roleIds: selectedRoleIds.length > 0 ? selectedRoleIds : undefined,
            isActive,
        });
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={resetAndClose}>
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
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 dark:text-white">
                                    Add User
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                    {errorMessage && (
                                        <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                First name
                                            </label>
                                            <input
                                                required
                                                minLength={2}
                                                className={inputClass}
                                                value={form.firstName}
                                                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                Last name
                                            </label>
                                            <input
                                                required
                                                minLength={2}
                                                className={inputClass}
                                                value={form.lastName}
                                                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            Email
                                        </label>
                                        <input
                                            required
                                            type="email"
                                            className={inputClass}
                                            value={form.email}
                                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            Temporary password
                                        </label>
                                        <input
                                            required
                                            type="password"
                                            minLength={8}
                                            maxLength={32}
                                            className={inputClass}
                                            value={form.password}
                                            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                                        />
                                        <p className="mt-1 text-[11px] text-gray-400">
                                            8-32 characters. Share this with the user directly — it isn&apos;t emailed automatically.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            Phone (optional)
                                        </label>
                                        <input
                                            className={inputClass}
                                            value={form.phone}
                                            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            Roles
                                        </label>
                                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                                            {roles.length === 0 ? (
                                                <span className="text-xs text-gray-400">No roles available</span>
                                            ) : (
                                                roles.map((role) => (
                                                    <label
                                                        key={role.id}
                                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium cursor-pointer transition-colors ${selectedRoleIds.includes(role.id)
                                                                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                                                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={selectedRoleIds.includes(role.id)}
                                                            onChange={() => toggleRole(role.id)}
                                                        />
                                                        {role.name}
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                        <p className="mt-1 text-[11px] text-gray-400">
                                            Defaults to the &quot;customer&quot; role if none selected.
                                        </p>
                                    </div>

                                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={(e) => setIsActive(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        Account active immediately
                                    </label>

                                    <div className="flex gap-3 justify-end pt-2">
                                        <button
                                            type="button"
                                            onClick={resetAndClose}
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
                                            {isSubmitting ? 'Creating...' : 'Create User'}
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
