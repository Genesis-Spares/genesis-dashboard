'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useMyProfile, useUpdateMyProfile } from '@/features/users/hooks/useUsers';

export default function MyProfilePage() {
    return (
        <ProtectedRoute>
            <MyProfilePageContent />
        </ProtectedRoute>
    );
}

function MyProfilePageContent() {
    const { data: profile, isLoading, isError, refetch } = useMyProfile();
    const updateProfile = useUpdateMyProfile();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [saved, setSaved] = useState(false);

    // Prefill the form once the profile loads. ManagedUser types the first
    // name field as `firstname` (lowercase n) — a pre-existing quirk of
    // this type, distinct from the `firstName` casing the update payload
    // uses.
    useEffect(() => {
        if (!profile) return;
        setFirstName(profile.firstname ?? '');
        setLastName(profile.lastName ?? '');
        setPhone(profile.phone ?? '');
    }, [profile]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSaved(false);
        updateProfile.mutate(
            {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phone.trim() || undefined,
            },
            {
                onSuccess: () => {
                    setSaved(true);
                    refetch();
                },
            }
        );
    };

    return (
        <div className="p-4 sm:p-6 max-w-2xl mx-auto">
            <Link
                href="/settings"
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
                <ChevronLeftIcon className="h-4 w-4" />
                Settings
            </Link>

            <div className="mt-3 mb-6">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">My Profile</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Update your own account details.
                </p>
            </div>

            {isLoading && (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    Loading your profile…
                </div>
            )}

            {isError && !isLoading && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-400">
                    Couldn't load your profile.{' '}
                    <button onClick={() => refetch()} className="font-medium underline">
                        Try again
                    </button>
                </div>
            )}

            {profile && !isLoading && (
                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                First name
                            </label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                minLength={2}
                                maxLength={50}
                                required
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Last name
                            </label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                minLength={2}
                                maxLength={50}
                                required
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Phone
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g. +254 700 000000"
                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-500"
                            />
                        </div>
                        {profile.roles?.length > 0 && (
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Roles
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {profile.roles.map((role) => (
                                        <span
                                            key={role.id}
                                            className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                        >
                                            {role.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {updateProfile.isError && (
                        <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                            Couldn't save your changes. Please try again.
                        </p>
                    )}

                    <div className="mt-6 flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={updateProfile.isPending}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                        >
                            {updateProfile.isPending ? 'Saving…' : 'Save changes'}
                        </button>
                        {saved && !updateProfile.isPending && (
                            <span className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                                <CheckCircleIcon className="h-4 w-4" />
                                Saved
                            </span>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}
