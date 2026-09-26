// src/types/sidebar.types.ts
export interface SidebarItem {
    id: string;
    title: string;
    icon: string;
    path: string;
    permission?: string | string[];
    role?: string | string[];
    /** Key of a live counter shown next to the item (e.g. 'urgent-orders'). */
    badge?: string;
    children?: SidebarItem[];
    isActive?: boolean;
}

export interface SidebarSection {
    id: string;
    /** Section heading; empty = no heading. */
    title: string;
    /** 'footer' pins the section to the bottom of the sidebar, above the user card. */
    placement?: 'main' | 'footer';
    items: SidebarItem[];
}

export interface SidebarConfig {
    sections: SidebarSection[];
    collapsed: boolean;
}

export interface Breadcrumb {
    title: string;
    path: string;
    isActive: boolean;
}