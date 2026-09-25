// src/features/users/components/EditUserModal.tsx
'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ACCOUNT_STATUSES, AccountStatus, ManagedUser, UpdateUserPayload } from '@/types/user-management.types';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (input: UpdateUserPayload) => void;
    user: ManagedUser | null;
    isSubmitting?: boolean;
}

const inputClass =
    'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500';

export function EditUserModal({ isOpen, onClose, onSubmit, user, isSubmitting = false }: EditUserModalProps) {
    const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
    const [status, setStatus] = useState<AccountStatus>('PENDING');
    const [isEmailVerified, setIsEmailVerified] = useState(false);

    useEffect(() => {
        if (user && isOpen) {
            setForm({ firstName: user.firstname, lastName: user.lastName, phone: user.phone || '' });
            setStatus(user.status);
            setIsEmailVerified(user.isEmailVerified);
        }
    }, [user, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone || undefined,
            status: user && status !== user.status ? status : undefined,
            isEmailVerified: user && isEmailVerified !== user.isEmailVerified ? isEmailVerified : undefined,
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 dark:text-white">
                                    Edit User
                                </Dialog.Title>

                                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
                                            Phone
                                        </label>
                                        <input
                                            className={inputClass}
                                            value={form.phone}
                                            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 items-end">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                Account status
                                            </label>
                                            <select
                                                className={inputClass}
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value as AccountStatus)}
                                            >
                                                {ACCOUNT_STATUSES.map((s) => (
                                                    <option key={s} value={s}>
                                                        {s.charAt(0) + s.slice(1).toLowerCase()}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 pb-2.5">
                                            <input
                                                type="checkbox"
                                                checked={isEmailVerified}
                                                onChange={(e) => setIsEmailVerified(e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            Email verified
                                        </label>
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
                                            {isSubmitting ? 'Saving...' : 'Save Changes'}
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
