'use client';

import Link from 'next/link';
import {
    UserGroupIcon,
    ShieldCheckIcon,
    UserCircleIcon,
    ChevronRightIcon,
    TruckIcon,
} from '@heroicons/react/24/outline';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface SettingsCard {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: typeof UserGroupIcon;
    // Omit to show to any authenticated user (e.g. "My Profile").
    permission?: string;
}

const SETTINGS_CARDS: SettingsCard[] = [
    {
        id: 'users',
        title: 'Users',
        description: 'Manage staff and customer accounts, activate or deactivate access.',
        href: '/users',
        icon: UserGroupIcon,
        permission: 'user:read',
    },
    {
        id: 'roles',
        title: 'Roles & Permissions',
        description: 'Define roles and control exactly what each one can do.',
        href: '/roles',
        icon: ShieldCheckIcon,
        permission: 'role:read',
    },
    {
        id: 'delivery',
        title: 'Delivery & VAT',
        description: 'Delivery zones and fees, pay-on-delivery areas, and the VAT rate charged at checkout.',
        href: '/settings/delivery',
        icon: TruckIcon,
        permission: 'settings:read',
    },
    {
        id: 'profile',
        title: 'My Profile',
        description: 'Update your own name, phone number, and account details.',
        href: '/settings/profile',
        icon: UserCircleIcon,
    },
];

export default function SettingsPage() {
    return (
        <ProtectedRoute>
            <SettingsPageContent />
        </ProtectedRoute>
    );
}

function SettingsPageContent() {
    const { can } = usePermissions();

    const visibleCards = SETTINGS_CARDS.filter((card) =>
        card.permission ? can({ permission: card.permission }) : true
    );

    return (
        <div className="p-4 sm:p-6 max-w-8xl">
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Manage users, roles, delivery and VAT, and your own account.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.id}
                            href={card.href}
                            className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-700/60"
                        >
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <ChevronRightIcon className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-400" />
                                </div>
                                <h2 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
                                    {card.title}
                                </h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {card.description}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
