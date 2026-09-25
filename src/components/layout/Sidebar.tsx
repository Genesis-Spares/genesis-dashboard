// src/components/layout/Sidebar.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/lib/stores/sidebarStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { SidebarItem } from '@/types/sidebar.types';
import {
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    ChevronRightIcon,
    ArrowUpRightIcon,
    BuildingStorefrontIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { resolveIcon } from '@/lib/utils/iconMap';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarProps {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

export const Sidebar = ({ mobileOpen = false, onMobileClose }: SidebarProps) => {
    const pathname = usePathname();
    const { config, collapsed, toggleCollapsed, fetchSidebar } = useSidebarStore();
    const { user } = useAuthStore();
    const { can } = usePermissions();
    const isMobile = useIsMobile();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    useEffect(() => {
        fetchSidebar();
    }, []);

    // Close mobile sidebar when route changes
    useEffect(() => {
        if (isMobile && onMobileClose) {
            onMobileClose();
        }
    }, [pathname, isMobile]);

    const toggleExpand = (itemId: string) => {
        setExpandedItems((prev) =>
            prev.includes(itemId)
                ? prev.filter((id) => id !== itemId)
                : [...prev, itemId]
        );
    };

    const renderItem = (item: SidebarItem, level: number = 0) => {
        if (!can({ permission: item.permission, role: item.role })) {
            return null;
        }

        const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
        const isExpanded = expandedItems.includes(item.id);
        const hasChildren = item.children && item.children.length > 0;
        const Icon = resolveIcon(item.icon);

        const baseClasses = `flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${isActive
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
            } ${collapsed && !isMobile ? 'justify-center' : ''}`;

        return (
            <li key={item.id} className="relative">
                {hasChildren ? (
                    <div>
                        <button
                            onClick={() => toggleExpand(item.id)}
                            className={`w-full ${baseClasses}`}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            {(!collapsed || isMobile) && (
                                <>
                                    <span className="ml-3 flex-1 text-left">{item.title}</span>
                                    <ChevronRightIcon
                                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''
                                            }`}
                                    />
                                </>
                            )}
                        </button>
                        {(!collapsed || isMobile) && isExpanded && hasChildren && (
                            <ul className="ml-4 mt-1 space-y-1 border-l border-gray-100 dark:border-gray-700 pl-2">
                                {item.children!.map((child) => renderItem(child, level + 1))}
                            </ul>
                        )}
                    </div>
                ) : (
                    <Link href={item.path} className={baseClasses}>
                        <Icon className="w-5 h-5 shrink-0" />
                        {(!collapsed || isMobile) && <span className="ml-3">{item.title}</span>}
                    </Link>
                )}
            </li>
        );
    };

    // Determine if sidebar should be visible
    const isVisible = isMobile ? mobileOpen : true;
    const sidebarWidth = isMobile ? 'w-80' : (collapsed ? 'w-16' : 'w-64');

    if (!config) {
        return (
            <div className={`${sidebarWidth} h-screen shrink-0 bg-white dark:bg-gray-800 animate-pulse`}>
                <div className="p-4">
                    <div className="h-8 bg-gray-100 rounded-xl dark:bg-gray-700"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50"
                    onClick={onMobileClose}
                />
            )}

            <aside
                className={`fixed lg:relative z-50 flex flex-col h-screen bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 transition-all duration-300 ${isMobile
                    ? `w-80 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`
                    : `${sidebarWidth} shrink-0`
                    }`}
            >
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-4 shrink-0">
                    {(!collapsed || isMobile) ? (
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
                            Genesis
                        </span>
                    ) : (
                        <BuildingStorefrontIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    )}

                    <div className="flex items-center gap-2">
                        {isMobile ? (
                            <button
                                onClick={onMobileClose}
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-700"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={toggleCollapsed}
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-700"
                            >
                                {collapsed ? (
                                    <ChevronDoubleRightIcon className="w-4 h-4" />
                                ) : (
                                    <ChevronDoubleLeftIcon className="w-4 h-4" />
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 overflow-y-auto">
                    {config.sections.map((section) => (
                        <div key={section.id} className="mb-4">
                            {(!collapsed || isMobile) && section.title && (
                                <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                                    {section.title}
                                </div>
                            )}
                            <ul className="space-y-1">
                                {section.items.map((item) => renderItem(item))}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* User + shop footer */}
                <div className="shrink-0 p-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                    <div className={`flex items-center gap-2 px-2 py-1.5 ${collapsed && !isMobile ? 'justify-center' : ''}`}>
                        <UserAvatar user={user} />
                        {(!collapsed || isMobile) && (
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                            </div>
                        )}
                        {(!collapsed || isMobile) && (
                            <ArrowUpRightIcon className="w-4 h-4 text-gray-300 shrink-0" />
                        )}
                    </div>

                    <Link
                        href="/shop"
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 ${collapsed && !isMobile ? 'justify-center' : ''
                            }`}
                    >
                        <BuildingStorefrontIcon className="w-5 h-5 shrink-0" />
                        {(!collapsed || isMobile) && (
                            <>
                                <span className="flex-1">Your Shop</span>
                                <ArrowUpRightIcon className="w-4 h-4 text-gray-300" />
                            </>
                        )}
                    </Link>
                </div>
            </aside>
        </>
    );
};

const UserAvatar = ({ user }: { user: { avatarUrl?: string; firstName?: string } | null }) => {
    if (user?.avatarUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={user.avatarUrl}
                alt=""
                className="w-9 h-9 rounded-full object-cover shrink-0"
            />
        );
    }
    return (
        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold shrink-0 dark:bg-blue-900/30 dark:text-blue-400">
            {user?.firstName?.[0]?.toUpperCase() ?? 'U'}
        </div>
    );
};