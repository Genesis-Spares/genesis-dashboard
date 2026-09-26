// src/lib/stores/sidebarStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    SidebarConfig,
    SidebarItem,
    SidebarSection,
} from '@/types/sidebar.types';
import { apiClient } from '@/lib/api/client';

interface SidebarStore {
    config: SidebarConfig | null;
    isLoading: boolean;
    error: string | null;
    collapsed: boolean;
    activeItems: string[];
    fetchSidebar: () => Promise<void>;
    toggleCollapsed: () => void;
    setActiveItem: (path: string) => void;
    clear: () => void;
}

// Fallback sidebar — only used if GET /sidebar is unreachable. Kept in sync
// with the canonical menu on the gateway (apps/api-gateway/src/common/config/sidebar-menu.ts):
// same routes, same permissions, so a dropped API call degrades gracefully
// instead of showing links to pages that don't exist or bypassing RBAC.
// Sidebar.tsx still filters every item through usePermissions().can(), so
// this list is RBAC-safe even before the API responds.
const DUMMY_SIDEBAR: SidebarSection[] = [
    {
        id: 'overview',
        title: '',
        items: [{ id: 'dashboard', title: 'Dashboard', icon: 'HomeIcon', path: '/dashboard' }],
    },
    {
        id: 'sales',
        title: 'Sales',
        items: [
            { id: 'orders', title: 'Orders', icon: 'ShoppingCartIcon', path: '/orders', permission: 'order:read' },
            { id: 'urgent-orders', title: 'Urgent orders', icon: 'ExclamationTriangleIcon', path: '/orders/urgent', permission: 'order:read', badge: 'urgent-orders' },
            { id: 'returns', title: 'Returns', icon: 'ArrowUturnLeftIcon', path: '/returns', permission: 'order:read' },
            { id: 'customers', title: 'Customers', icon: 'UsersIcon', path: '/customers', permission: 'customer:read' },
        ],
    },
    {
        id: 'catalog',
        title: 'Catalog',
        items: [
            { id: 'product-list', title: 'Products', icon: 'ArchiveBoxIcon', path: '/products', permission: 'product:read' },
            { id: 'categories', title: 'Categories', icon: 'Squares2X2Icon', path: '/categories', permission: 'category:read' },
            { id: 'inventory', title: 'Inventory', icon: 'CubeIcon', path: '/inventory', permission: 'product:update' },
            { id: 'flash-sale', title: 'Flash Sale', icon: 'BoltIcon', path: '/flash-sale', permission: 'catalog:manage' },
        ],
    },
    {
        id: 'customer-care',
        title: 'Customer care',
        items: [
            { id: 'messages', title: 'Messages', icon: 'ChatBubbleLeftRightIcon', path: '/messages', permission: 'message:read' },
            { id: 'emails', title: 'Emails', icon: 'EnvelopeIcon', path: '/emails', permission: 'message:read' },
            { id: 'reviews', title: 'Reviews', icon: 'StarIcon', path: '/reviews', permission: 'review:read' },
        ],
    },
    {
        id: 'insights',
        title: 'Insights',
        items: [
            { id: 'reports', title: 'Reports', icon: 'ChartBarIcon', path: '/reports', permission: 'analytics:read' },
            { id: 'activity', title: 'Activity Log', icon: 'ClockIcon', path: '/activity', permission: 'user:read' },
        ],
    },
    {
        id: 'system',
        title: '',
        placement: 'footer',
        items: [{ id: 'settings', title: 'Settings', icon: 'Cog6ToothIcon', path: '/settings' }],
    },
];

export const useSidebarStore = create<SidebarStore>()(
    persist(
        (set, get) => ({
            config: null,
            isLoading: false,
            error: null,
            collapsed: false,
            activeItems: [],

            fetchSidebar: async () => {
                set({ isLoading: true, error: null });

                try {
                    // apiClient.get() already returns the unwrapped response
                    // body (see lib/api/client.ts), so `response` IS
                    // `{ sections }` here — not an axios-style wrapper.
                    const response = await apiClient.get<{
                        sections: SidebarSection[] | null;
                    }>('/sidebar');

                    const sections = response?.sections;

                    set({
                        config: {
                            sections:
                                sections && sections.length > 0
                                    ? sections
                                    : DUMMY_SIDEBAR,
                            collapsed: get().collapsed,
                        },
                        isLoading: false,
                    });
                } catch (error: any) {
                    // Use dummy sidebar if API fails
                    set({
                        config: {
                            sections: DUMMY_SIDEBAR,
                            collapsed: get().collapsed,
                        },
                        isLoading: false,
                        error: error.message || 'Failed to load sidebar',
                    });
                }
            },

            toggleCollapsed: () => {
                set((state) => {
                    const collapsed = !state.collapsed;

                    return {
                        collapsed,
                        config: state.config
                            ? {
                                ...state.config,
                                collapsed,
                            }
                            : null,
                    };
                });
            },

            setActiveItem: (path: string) => {
                set((state) => ({
                    activeItems: state.activeItems.includes(path)
                        ? state.activeItems
                        : [...state.activeItems, path],
                }));
            },

            clear: () => {
                set({
                    config: null,
                    isLoading: false,
                    error: null,
                    activeItems: [],
                });
            },
        }),
        {
            name: 'sidebar-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                collapsed: state.collapsed,
                activeItems: state.activeItems,
            }),
        }
    )
);