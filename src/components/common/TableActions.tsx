// src/components/common/TableActions.tsx
'use client';

import { useState, Fragment, useRef, useEffect } from 'react';
import {
    PencilSquareIcon,
    TrashIcon,
    EyeIcon,
    EllipsisVerticalIcon,
    EllipsisHorizontalIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { useIsMobile } from '@/hooks/use-mobile';

export interface ActionItem {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger' | 'success' | 'warning' | 'info';
    disabled?: boolean;
    divider?: boolean;
}

export interface TableActionsProps {
    /** Primary actions shown as icons (desktop) or in dropdown (mobile) */
    primaryActions?: ActionItem[];
    /** Secondary actions shown in dropdown menu */
    secondaryActions?: ActionItem[];
    /** Show view action */
    onView?: () => void;
    /** Show edit action */
    onEdit?: () => void;
    /** Show delete action */
    onDelete?: () => void;
    /** Custom className */
    className?: string;
    /** Size of the action buttons */
    size?: 'sm' | 'md' | 'lg';
    /** Align the dropdown menu */
    align?: 'left' | 'right';
}

const getVariantStyles = (variant?: string) => {
    switch (variant) {
        case 'danger':
            return 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20';
        case 'success':
            return 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20';
        case 'warning':
            return 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20';
        case 'info':
            return 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20';
        default:
            return 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700';
    }
};

const getSizeStyles = (size?: string) => {
    switch (size) {
        case 'sm':
            return 'p-1';
        case 'lg':
            return 'p-2.5';
        default:
            return 'p-1.5';
    }
};

const getIconSize = (size?: string) => {
    switch (size) {
        case 'sm':
            return 'w-3.5 h-3.5';
        case 'lg':
            return 'w-5 h-5';
        default:
            return 'w-4 h-4';
    }
};

export function TableActions({
    primaryActions = [],
    secondaryActions = [],
    onView,
    onEdit,
    onDelete,
    className = '',
    size = 'md',
    align = 'right',
}: TableActionsProps) {
    const isMobile = useIsMobile();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Build actions from props
    const builtPrimaryActions: ActionItem[] = [...primaryActions];

    if (onView) {
        builtPrimaryActions.push({
            label: 'View',
            icon: <EyeIcon className={getIconSize(size)} />,
            onClick: onView,
            variant: 'info',
        });
    }

    if (onEdit) {
        builtPrimaryActions.push({
            label: 'Edit',
            icon: <PencilSquareIcon className={getIconSize(size)} />,
            onClick: onEdit,
            variant: 'success',
        });
    }

    if (onDelete) {
        builtPrimaryActions.push({
            label: 'Delete',
            icon: <TrashIcon className={getIconSize(size)} />,
            onClick: onDelete,
            variant: 'danger',
        });
    }

    // Build secondary actions
    const builtSecondaryActions: ActionItem[] = [...secondaryActions];

    // On mobile, move primary actions to dropdown if there are more than 2
    const displayActions = isMobile && builtPrimaryActions.length > 2
        ? builtPrimaryActions.slice(0, 2)
        : builtPrimaryActions;

    const dropdownActions = isMobile && builtPrimaryActions.length > 2
        ? [...builtPrimaryActions.slice(2), ...builtSecondaryActions]
        : builtSecondaryActions;

    const hasDropdownActions = dropdownActions.length > 0;

    const sizeStyles = getSizeStyles(size);
    const iconSize = getIconSize(size);

    // Determine dropdown alignment
    const dropdownAlignClass = align === 'left' ? 'left-0' : 'right-0';

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {/* Primary Actions */}
            {displayActions.map((action, index) => (
                <button
                    key={`action-${index}`}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`rounded-lg transition-colors ${sizeStyles} ${getVariantStyles(action.variant)} ${action.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                    aria-label={action.label}
                    title={action.label}
                >
                    {action.icon || (
                        <span className="text-xs font-medium">
                            {action.label.charAt(0)}
                        </span>
                    )}
                </button>
            ))}

            {/* Dropdown Menu */}
            {hasDropdownActions && (
                <Menu as="div" className="relative" ref={menuRef}>
                    <Menu.Button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`rounded-lg transition-colors ${sizeStyles} text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700`}
                        aria-label="More actions"
                        title="More actions"
                    >
                        {isMobile ? (
                            <EllipsisHorizontalIcon className={iconSize} />
                        ) : (
                            <EllipsisVerticalIcon className={iconSize} />
                        )}
                    </Menu.Button>

                    <Transition
                        as={Fragment}
                        enter="transition duration-100 ease-out"
                        enterFrom="transform scale-95 opacity-0"
                        enterTo="transform scale-100 opacity-100"
                        leave="transition duration-75 ease-in"
                        leaveFrom="transform scale-100 opacity-100"
                        leaveTo="transform scale-95 opacity-0"
                    >
                        <Menu.Items
                            className={`absolute ${dropdownAlignClass} mt-1 w-48 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px] max-w-[calc(100vw-2rem)]`}
                        >
                            {dropdownActions.map((action, index) => (
                                <Menu.Item key={`dropdown-${index}`}>
                                    {({ active }) => (
                                        <div>
                                            {action.divider && (
                                                <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                                            )}
                                            <button
                                                onClick={() => {
                                                    action.onClick();
                                                    setIsOpen(false);
                                                }}
                                                disabled={action.disabled}
                                                className={`w-full px-4 py-2 text-sm text-left transition-colors flex items-center gap-2 ${active
                                                        ? 'bg-gray-50 dark:bg-gray-700'
                                                        : ''
                                                    } ${action.variant === 'danger'
                                                        ? 'text-red-600 dark:text-red-400'
                                                        : 'text-gray-700 dark:text-gray-300'
                                                    } ${action.disabled ? 'opacity-40 cursor-not-allowed' : ''
                                                    }`}
                                            >
                                                {action.icon && (
                                                    <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                                                        {action.icon}
                                                    </span>
                                                )}
                                                <span className="truncate">{action.label}</span>
                                            </button>
                                        </div>
                                    )}
                                </Menu.Item>
                            ))}
                        </Menu.Items>
                    </Transition>
                </Menu>
            )}
        </div>
    );
}

// Helper function to create status change actions
export const createStatusActions = (
    onSetActive: () => void,
    onSetInactive: () => void
): ActionItem[] => [
        {
            label: 'Set Active',
            icon: <CheckCircleIcon className="w-4 h-4 text-blue-500" />,
            onClick: onSetActive,
            variant: 'success',
        },
        {
            label: 'Set Inactive',
            icon: <XCircleIcon className="w-4 h-4 text-gray-400" />,
            onClick: onSetInactive,
            variant: 'warning',
            divider: true,
        },
    ];