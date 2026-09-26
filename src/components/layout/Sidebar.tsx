// src/components/layout/Sidebar.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/lib/stores/sidebarStore';
import { useAuthStore } from '@/lib/stores/authStore';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { SidebarItem, SidebarSection } from '@/types/sidebar.types';
import {
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    ChevronRightIcon,
    ArrowUpRightIcon,
    BuildingStorefrontIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { resolveIcon } from '@/lib/utils/iconMap';
import { useIsDrawerNav } from '@/hooks/use-mobile';
import { useUrgentOrderCount } from '@/features/orders/hooks/useUrgentOrderCount';

// the live storefront, opened from the "Your Shop" link
const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://genisis.space';

const flatten = (items: SidebarItem[]): SidebarItem[] =>
    items.flatMap((i) => [i, ...(i.children ? flatten(i.children) : [])]);

interface SidebarProps {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

export const Sidebar = ({ mobileOpen = false, onMobileClose }: SidebarProps) => {
    const pathname = usePathname();
    const { config, collapsed, toggleCollapsed, fetchSidebar } = useSidebarStore();
    const { user } = useAuthStore();
    const { can } = usePermissions();
    // below lg the sidebar is an off-canvas drawer; visibility itself is CSS-driven so it's
    // right on first paint, this flag only picks drawer vs collapsible-rail rendering
    const isMobile = useIsDrawerNav();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const sections = config?.sections ?? [];
    const mainSections = sections.filter((s) => s.placement !== 'footer');
    const footerSections = sections.filter((s) => s.placement === 'footer');

    // Highlight only the most specific match, so /orders/urgent lights up
    // "Urgent orders" rather than both it and "Orders".
    const activePath = useMemo(() => {
        const paths = sections.flatMap((s) => flatten(s.items)).map((i) => i.path);
        return paths
            .filter((p) => pathname === p || pathname.startsWith(`${p}/`))
            .sort((a, b) => b.length - a.length)[0];
    }, [sections, pathname]);

    // Live counters for items that declare a `badge`
    const wantsUrgent = sections.some((s) => flatten(s.items).some((i) => i.badge === 'urgent-orders'));
    const urgent = useUrgentOrderCount(wantsUrgent && can({ permission: 'order:read' }));
    const badges: Record<string, string | undefined> = {
        'urgent-orders': urgent.data?.count ? `${urgent.data.count}${urgent.data.more ? '+' : ''}` : undefined,
    };

    useEffect(() => {
        fetchSidebar();
    }, []);

    // Close the drawer when the route changes
    useEffect(() => {
        onMobileClose?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    // Close the drawer with Escape, and stop the page behind it scrolling while open
    useEffect(() => {
        if (!mobileOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onMobileClose?.();
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [mobileOpen, onMobileClose]);

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

        const isActive = item.path === activePath;
        const badge = item.badge ? badges[item.badge] : undefined;
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
                    <Link
                        href={item.path}
                        className={baseClasses}
                        aria-current={isActive ? 'page' : undefined}
                        title={collapsed && !isMobile ? item.title : undefined}
                    >
                        <span className="relative shrink-0">
                            <Icon className="w-5 h-5" />
                            {/* collapsed rail: a dot instead of the number */}
                            {badge && collapsed && !isMobile && (
                                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-gray-800" />
                            )}
                        </span>
                        {(!collapsed || isMobile) && <span className="ml-3 flex-1 truncate">{item.title}</span>}
                        {badge && (!collapsed || isMobile) && (
                            <span
                                aria-label={`${badge} need attention`}
                                className={`ml-2 min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none tabular-nums ${isActive ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'}`}
                            >
                                {badge}
                            </span>
                        )}
                    </Link>
                )}
            </li>
        );
    };

    const railWidth = collapsed ? 'lg:w-16' : 'lg:w-64';

    if (!config) {
        return (
            <div className={`hidden lg:block ${railWidth} h-screen shrink-0 bg-white dark:bg-gray-800 animate-pulse`}>
                <div className="p-4">
                    <div className="h-8 bg-gray-100 rounded-xl dark:bg-gray-700"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Drawer backdrop (below lg) */}
            <div
                aria-hidden="true"
                onClick={onMobileClose}
                className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            />

            <aside
                aria-label="Main navigation"
                // off-canvas and closed: keep its links out of the tab order / screen readers
                inert={isMobile && !mobileOpen ? true : undefined}
                className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(20rem,85vw)] flex-col bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 transition-[transform,width] duration-300 lg:static lg:h-screen lg:shrink-0 lg:translate-x-0 ${railWidth} ${mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`}
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
                                aria-label="Close menu"
                                className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-700"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={toggleCollapsed}
                                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
                <nav aria-label="Main" className="flex-1 px-3 overflow-y-auto">
                    {mainSections.map((section: SidebarSection) => (
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

                {/* Footer: pinned items (Settings), the signed-in user, and the storefront */}
                <div className="shrink-0 p-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                    {footerSections.map((section) => (
                        <ul key={section.id} className="space-y-1">
                            {section.items.map((item) => renderItem(item))}
                        </ul>
                    ))}
                    <Link
                        href="/settings/profile"
                        title="My profile"
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 ${collapsed && !isMobile ? 'justify-center' : ''}`}
                    >
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
                    </Link>

                    <a
                        href={STOREFRONT_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open the storefront in a new tab"
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
                    </a>
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