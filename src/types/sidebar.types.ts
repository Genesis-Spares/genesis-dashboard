// src/types/sidebar.types.ts
export interface SidebarItem {
    id: string;
    title: string;
    icon: string;
    path: string;
    permission?: string | string[];
    role?: string | string[];
    children?: SidebarItem[];
    isActive?: boolean;
}

export interface SidebarSection {
    id: string;
    title: string;
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