// tabs/ActivitiesTab.tsx

import { useState, useMemo } from 'react';
import {
    ClockIcon,
    UserIcon,
    ShoppingBagIcon,
    CreditCardIcon,
    ChatBubbleLeftIcon,
    PencilSquareIcon,
    TrashIcon,
    GlobeAltIcon,
    DevicePhoneMobileIcon,
    EnvelopeIcon,
    BellIcon,
    StarIcon,
    MapPinIcon,
    TagIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline';
import {
    ClockIcon as ClockSolid,
    UserIcon as UserSolid,
    ShoppingBagIcon as ShoppingBagSolid,
} from '@heroicons/react/24/solid';

// ============================================
// TYPES
// ============================================

interface Activity {
    id: string;
    action: string;
    resource?: string;
    resourceId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
}

interface ActivitiesTabProps {
    activities: Activity[];
    onLoadMore?: () => void;
    hasMore?: boolean;
    isLoading?: boolean;
    total?: number;
}

// ============================================
// HELPERS
// ============================================

function formatAction(action: string): string {
    return action
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase());
}

function getActionIcon(action: string) {
    const lowerAction = action.toLowerCase();

    if (lowerAction.includes('login') || lowerAction.includes('auth')) {
        return { icon: UserSolid, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' };
    }
    if (lowerAction.includes('order') || lowerAction.includes('purchase')) {
        return { icon: ShoppingBagSolid, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' };
    }
    if (lowerAction.includes('payment') || lowerAction.includes('transaction')) {
        return { icon: CreditCardIcon, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' };
    }
    if (lowerAction.includes('message') || lowerAction.includes('communication')) {
        return { icon: ChatBubbleLeftIcon, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' };
    }
    if (lowerAction.includes('email')) {
        return { icon: EnvelopeIcon, color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' };
    }
    if (lowerAction.includes('sms') || lowerAction.includes('text')) {
        return { icon: DevicePhoneMobileIcon, color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' };
    }
    if (lowerAction.includes('push') || lowerAction.includes('notification')) {
        return { icon: BellIcon, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' };
    }
    if (lowerAction.includes('review') || lowerAction.includes('rating')) {
        return { icon: StarIcon, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' };
    }
    if (lowerAction.includes('address')) {
        return { icon: MapPinIcon, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' };
    }
    if (lowerAction.includes('preference') || lowerAction.includes('setting')) {
        return { icon: TagIcon, color: 'text-gray-500 bg-gray-50 dark:bg-gray-800' };
    }
    if (lowerAction.includes('update') || lowerAction.includes('edit') || lowerAction.includes('change')) {
        return { icon: PencilSquareIcon, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' };
    }
    if (lowerAction.includes('delete') || lowerAction.includes('remove')) {
        return { icon: TrashIcon, color: 'text-red-500 bg-red-50 dark:bg-red-900/20' };
    }
    if (lowerAction.includes('create') || lowerAction.includes('add')) {
        return { icon: PlusIcon, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' };
    }
    if (lowerAction.includes('view') || lowerAction.includes('visit')) {
        return { icon: GlobeAltIcon, color: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20' };
    }

    return { icon: InformationCircleIcon, color: 'text-gray-400 bg-gray-50 dark:bg-gray-800' };
}

// Every activity's status label renders in the same blue, regardless of
// the underlying action (success/fail/pending/etc.) — status color no
// longer carries semantic meaning here.
function getStatusColor(_action: string): string {
    return 'text-blue-600 dark:text-blue-400';
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${diffYears}y ago`;
}

function getActionEmoji(action: string): string {
    const lowerAction = action.toLowerCase();

    if (lowerAction.includes('login')) return '🔐';
    if (lowerAction.includes('order')) return '📦';
    if (lowerAction.includes('payment') || lowerAction.includes('transaction')) return '💳';
    if (lowerAction.includes('email')) return '📧';
    if (lowerAction.includes('sms') || lowerAction.includes('text')) return '📱';
    if (lowerAction.includes('push') || lowerAction.includes('notification')) return '🔔';
    if (lowerAction.includes('review') || lowerAction.includes('rating')) return '⭐';
    if (lowerAction.includes('address')) return '📍';
    if (lowerAction.includes('preference') || lowerAction.includes('setting')) return '⚙️';
    if (lowerAction.includes('update') || lowerAction.includes('edit') || lowerAction.includes('change')) return '✏️';
    if (lowerAction.includes('delete') || lowerAction.includes('remove')) return '🗑️';
    if (lowerAction.includes('create') || lowerAction.includes('add')) return '✨';
    if (lowerAction.includes('view') || lowerAction.includes('visit')) return '👁️';
    if (lowerAction.includes('wishlist') || lowerAction.includes('favorite')) return '❤️';

    return '📌';
}

// ============================================
// COMPONENTS
// ============================================

function InfoCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {title}
                </h3>
                {action}
            </div>
            {children}
        </div>
    );
}

function ActivitySkeleton() {
    return (
        <div className="flex items-start gap-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 shrink-0" />
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ActivitiesTab({
    activities,
    onLoadMore,
    hasMore = false,
    isLoading = false,
    total = 0,
}: ActivitiesTabProps) {
    const [filter, setFilter] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Get unique action types for filter
    const actionTypes = useMemo(() => {
        const types = new Set(activities.map(a => a.action));
        return Array.from(types);
    }, [activities]);

    // Filter activities
    const filteredActivities = useMemo(() => {
        if (filter === 'all') return activities;
        return activities.filter(a => a.action === filter);
    }, [activities, filter]);

    // Group activities by date
    const groupedActivities = useMemo(() => {
        const groups: Record<string, Activity[]> = {};

        filteredActivities.forEach((activity) => {
            const date = new Date(activity.createdAt);
            const key = date.toDateString();
            if (!groups[key]) groups[key] = [];
            groups[key].push(activity);
        });

        return groups;
    }, [filteredActivities]);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const getDateLabel = (dateStr: string): string => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        });
    };

    const totalDisplay = total > 0 ? total : activities.length;

    return (
        <InfoCard
            title={`Activities (${totalDisplay})`}
            action={
                actionTypes.length > 1 && (
                    <select
                        className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Activities</option>
                        {actionTypes.map((type) => (
                            <option key={type} value={type}>
                                {formatAction(type)}
                            </option>
                        ))}
                    </select>
                )
            }
        >
            {isLoading && activities.length === 0 ? (
                // Loading state
                <div className="space-y-0">
                    {[...Array(5)].map((_, i) => (
                        <ActivitySkeleton key={i} />
                    ))}
                </div>
            ) : filteredActivities.length > 0 ? (
                <div className="space-y-4">
                    {Object.entries(groupedActivities).map(([date, items]) => (
                        <div key={date}>
                            {/* Date header */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                    {getDateLabel(date)}
                                </span>
                                <span className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                                <span className="text-[10px] text-gray-400">
                                    {items.length} {items.length === 1 ? 'activity' : 'activities'}
                                </span>
                            </div>

                            {/* Activities */}
                            <div className="space-y-0">
                                {items.map((activity) => {
                                    const { icon: Icon, color } = getActionIcon(activity.action);
                                    const statusColor = getStatusColor(activity.action);
                                    const emoji = getActionEmoji(activity.action);
                                    const isExpanded = expandedId === activity.id;
                                    const timeAgo = getTimeAgo(new Date(activity.createdAt));
                                    const formattedAction = formatAction(activity.action);

                                    return (
                                        <div
                                            key={activity.id}
                                            className="group relative py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                                            onClick={() => toggleExpand(activity.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Icon */}
                                                <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center shrink-0 mt-0.5`}>
                                                    {Icon ? <Icon className="w-4 h-4" /> : <span className="text-base">{emoji}</span>}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center flex-wrap gap-2">
                                                        <span className={`text-sm font-medium ${statusColor}`}>
                                                            {formattedAction}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {timeAgo}
                                                        </span>
                                                    </div>

                                                    {/* Resource info */}
                                                    {activity.resource && (
                                                        <p className="text-xs text-gray-400 truncate">
                                                            {activity.resource}
                                                            {activity.resourceId && (
                                                                <span className="font-mono text-[10px] ml-1">
                                                                    · {activity.resourceId.slice(0, 8)}
                                                                </span>
                                                            )}
                                                        </p>
                                                    )}

                                                    {/* Metadata preview */}
                                                    {activity.metadata && !isExpanded && (
                                                        <p className="text-xs text-gray-400 truncate mt-0.5">
                                                            {typeof activity.metadata === 'object'
                                                                ? JSON.stringify(activity.metadata).slice(0, 60)
                                                                : String(activity.metadata).slice(0, 60)
                                                            }
                                                            {JSON.stringify(activity.metadata).length > 60 ? '…' : ''}
                                                        </p>
                                                    )}

                                                    {/* Expanded details */}
                                                    {isExpanded && (
                                                        <div className="mt-2 space-y-1.5">
                                                            {activity.metadata && (
                                                                <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                                        Metadata
                                                                    </p>
                                                                    <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-all font-mono">
                                                                        {typeof activity.metadata === 'object'
                                                                            ? JSON.stringify(activity.metadata, null, 2)
                                                                            : String(activity.metadata)
                                                                        }
                                                                    </pre>
                                                                </div>
                                                            )}

                                                            <div className="flex flex-wrap gap-3 text-[10px] text-gray-400">
                                                                {activity.ipAddress && (
                                                                    <span className="flex items-center gap-1">
                                                                        🌐 {activity.ipAddress}
                                                                    </span>
                                                                )}
                                                                {activity.userAgent && (
                                                                    <span className="flex items-center gap-1">
                                                                        📱 {activity.userAgent.split(' ').slice(0, 3).join(' ')}
                                                                    </span>
                                                                )}
                                                                <span className="flex items-center gap-1">
                                                                    🕐 {new Date(activity.createdAt).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Expand indicator */}
                                                <button
                                                    className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleExpand(activity.id);
                                                    }}
                                                >
                                                    <ChevronDownIcon
                                                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Load more */}
                    {hasMore && (
                        <div className="flex justify-center pt-4">
                            <button
                                onClick={onLoadMore}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                        Loading...
                                    </span>
                                ) : (
                                    'Load more activities'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                // Empty state
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <ClockIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No activities yet</p>
                    <p className="text-xs text-gray-400 mt-1">Activities will appear here as the customer interacts</p>
                </div>
            )}
        </InfoCard>
    );
}

// ============================================
// ADD MISSING IMPORTS
// ============================================

import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';