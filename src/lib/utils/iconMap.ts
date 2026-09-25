// src/lib/utils/iconMap.tsx
import {
    HomeIcon,
    UsersIcon,
    Cog6ToothIcon,
    ShoppingCartIcon,
    ArchiveBoxIcon,
    ChartBarIcon,
    TagIcon,
    Squares2X2Icon,
    ClipboardDocumentListIcon,
    CreditCardIcon,
    StarIcon,
    PhotoIcon,
    ChatBubbleLeftRightIcon,
    ShieldCheckIcon,
    AdjustmentsHorizontalIcon,
    BuildingStorefrontIcon,
    UserCircleIcon,
    BellIcon,
    UserGroupIcon,
    QuestionMarkCircleIcon,
    BoltIcon,
    ArrowUturnLeftIcon,
    EnvelopeIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Maps the string icon names coming from the sidebar config (backend/API)
 * to actual Heroicon components. Add new entries here whenever a new
 * icon name is introduced in the sidebar config.
 */
const iconMap: Record<string, IconComponent> = {
    HomeIcon,
    UsersIcon,
    Cog6ToothIcon,
    ShoppingCartIcon,
    ArchiveBoxIcon,
    ChartBarIcon,
    TagIcon,
    Squares2X2Icon,
    ClipboardDocumentListIcon,
    CreditCardIcon,
    StarIcon,
    PhotoIcon,
    ChatBubbleLeftRightIcon,
    ShieldCheckIcon,
    AdjustmentsHorizontalIcon,
    BuildingStorefrontIcon,
    UserCircleIcon,
    BellIcon,
    UserGroupIcon,
    BoltIcon,
    ArrowUturnLeftIcon,
    EnvelopeIcon,
};

/**
 * Resolves a string icon name (as stored in SidebarItem.icon) to its
 * corresponding Heroicon component. Falls back to a question-mark icon
 * if the name isn't recognized, so a bad/missing config value never
 * breaks rendering.
 */
export const resolveIcon = (name: string): IconComponent => {
    return iconMap[name] ?? QuestionMarkCircleIcon;
};