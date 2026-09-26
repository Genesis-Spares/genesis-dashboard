// src/components/layout/Header.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import {
    SunIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
    MagnifyingGlassIcon,
    Bars3Icon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';

interface HeaderProps {
    onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <header className="sticky top-0 z-20 h-16 shrink-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between h-full px-3 sm:px-4 md:px-6 gap-2 md:gap-4">
                {/* Menu button + logo (below lg, where the sidebar is a drawer) */}
                <div className="flex items-center gap-1 lg:hidden">
                    <button
                        onClick={onMenuClick}
                        aria-label="Open menu"
                        className="-ml-1 p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        <Bars3Icon className="w-6 h-6" />
                    </button>
                    <Link href="/dashboard" className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        Genesis
                    </Link>
                </div>

                {/* Search - Hidden on mobile */}
                <div className="flex-1 max-w-md hidden md:block">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search data, users, or reports"
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 rounded-full border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none transition-colors"
                        />
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    <InstallPrompt />
                    <NotificationBell />

                    <button className="p-2 rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 hidden sm:block">
                        <SunIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>

                    <Menu as="div" className="relative">
                        <Menu.Button className="flex items-center rounded-full">
                            {user?.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={user.avatar}
                                    alt=""
                                    className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover"
                                />
                            ) : (
                                <UserCircleIcon className="w-8 h-8 md:w-9 md:h-9 text-gray-300" />
                            )}
                        </Menu.Button>

                        <Transition
                            enter="transition duration-100 ease-out"
                            enterFrom="transform scale-95 opacity-0"
                            enterTo="transform scale-100 opacity-100"
                            leave="transition duration-75 ease-in"
                            leaveFrom="transform scale-100 opacity-100"
                            leaveTo="transform scale-95 opacity-0"
                        >
                            <Menu.Items className="absolute right-0 z-50 mt-2 w-56 max-w-[calc(100vw-1.5rem)] origin-top-right bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                                <div className="px-4 py-3">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {user?.firstName
                                            ? `${user.firstName} ${user.lastName || ''}`.trim()
                                            : user?.email}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                        {user?.email}
                                    </p>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {user?.roles.map((role) => (
                                            <span
                                                key={role}
                                                className="text-xs font-medium text-blue-600 dark:text-blue-400"
                                            >
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="py-1">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <Link
                                                href="/settings/profile"
                                                className={`block px-4 py-2 text-sm ${active ? 'bg-gray-50 dark:bg-gray-700' : ''
                                                    }`}
                                            >
                                                Profile Settings
                                            </Link>
                                        )}
                                    </Menu.Item>
                                </div>

                                <div className="py-1">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={handleLogout}
                                                disabled={isLoggingOut}
                                                className={`flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 ${active ? 'bg-gray-50 dark:bg-gray-700' : ''
                                                    } ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                                                {isLoggingOut ? 'Logging out...' : 'Sign out'}
                                            </button>
                                        )}
                                    </Menu.Item>
                                </div>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                </div>
            </div>
        </header>
    );
};