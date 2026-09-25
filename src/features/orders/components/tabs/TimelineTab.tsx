import {
    CheckCircleIcon,
    ClockIcon,
    TruckIcon,
    XCircleIcon,
    ArrowPathIcon,
    CreditCardIcon,
} from '@heroicons/react/24/outline';
import { OrderStatusHistoryEntry } from '@/types/order.types';

interface TimelineTabProps {
    history: OrderStatusHistoryEntry[];
    isLoading?: boolean;
}

// Every timeline marker uses the same blue treatment regardless of status —
// only the icon glyph still varies, to keep entries visually distinguishable.
const STATUS_COLOR = 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';

function getStatusIcon(status: string) {
    switch (status) {
        case 'DELIVERED':
            return { icon: CheckCircleIcon, color: STATUS_COLOR };
        case 'SHIPPED':
            return { icon: TruckIcon, color: STATUS_COLOR };
        case 'CANCELLED':
            return { icon: XCircleIcon, color: STATUS_COLOR };
        case 'REFUNDED':
            return { icon: ArrowPathIcon, color: STATUS_COLOR };
        default:
            if (status.toLowerCase().includes('payment')) {
                return { icon: CreditCardIcon, color: STATUS_COLOR };
            }
            return { icon: ClockIcon, color: STATUS_COLOR };
    }
}

export function TimelineTab({ history, isLoading }: TimelineTabProps) {
    return (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-5">
                Timeline
            </h3>

            {isLoading ? (
                <p className="text-sm text-gray-400 py-6 text-center">Loading…</p>
            ) : history.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No status changes recorded yet.</p>
            ) : (
                <div className="space-y-0">
                    {history.map((entry, index) => {
                        const { icon: Icon, color } = getStatusIcon(entry.status);
                        const isLast = index === history.length - 1;
                        return (
                            <div key={entry.id} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    {!isLast && <div className="w-px flex-1 bg-gray-100 dark:bg-gray-800 my-1" />}
                                </div>
                                <div className="pb-6 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                            {entry.status}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(entry.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    {entry.note && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{entry.note}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
