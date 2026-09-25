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
        id: 'main',
        title: 'Main menu',
        items: [
            {
                id: 'dashboard',
                title: 'Dashboard',
                icon: 'HomeIcon',
                path: '/dashboard',
                permission: '',
            },
            {
                id: 'order-management',
                title: 'Order Management',
                icon: 'ShoppingCartIcon',
                path: '/orders',
                permission: 'order:read',
            },
            {
                id: 'customers',
                title: 'Customers',
                icon: 'UsersIcon',
                path: '/customers',
                permission: 'customer:read',
            },
            {
                id: 'settings',
                title: 'Settings',
                icon: 'Cog6ToothIcon',
                path: '/settings',
                permission: '',
            },
        ],
    },
    {
        id: 'catalog',
        title: 'Catalog',
        items: [
            {
                id: 'product-list',
                title: 'Products',
                icon: 'ArchiveBoxIcon',
                path: '/products',
                permission: 'product:read',
            },
            {
                id: 'categories',
                title: 'Categories',
                icon: 'Squares2X2Icon',
                path: '/categories',
                permission: 'category:read',
            },
            {
                id: 'flash-sale',
                title: 'Flash Sale',
                icon: 'BoltIcon',
                path: '/flash-sale',
                permission: 'catalog:manage',
            },
        ],
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