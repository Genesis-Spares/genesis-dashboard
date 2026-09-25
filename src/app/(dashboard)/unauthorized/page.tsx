// src/app/(dashboard)/unauthorized/page.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldExclamationIcon, ArrowLeftIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/lib/stores/authStore';

export default function UnauthorizedPage() {
    const router = useRouter();
    const { user } = useAuthStore();

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center ring-8 ring-red-50/50 dark:ring-red-950/20">
                    <ShieldExclamationIcon className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                        Error 403 • Access Denied
                    </span>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Permission Required
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        You do not have the required permissions to access this page or resource. Please contact your system administrator if you believe this is an error.
                    </p>
                </div>

                {user && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 text-left border border-gray-100 dark:border-gray-800 space-y-1">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Current Account
                        </p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {user.email}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {user.roles?.map((role) => (
                                <span
                                    key={role}
                                    className="text-xs font-medium text-blue-600 dark:text-blue-400"
                                >
                                    Role: {role}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Go Back
                    </button>
                    <Link
                        href="/dashboard"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm shadow-blue-600/20 transition-colors"
                    >
                        <HomeIcon className="w-4 h-4" />
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
