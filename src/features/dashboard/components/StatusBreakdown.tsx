// src/features/dashboard/components/StatusBreakdown.tsx
import Link from 'next/link';

// fulfilment pipeline order; closed states grouped at the end
const PIPELINE = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'PROCESSING', label: 'Processing' },
    { key: 'SHIPPED', label: 'Shipped' },
    { key: 'DELIVERED', label: 'Delivered' },
    { key: 'CANCELLED', label: 'Cancelled' },
    { key: 'REFUNDED', label: 'Refunded' },
] as const;

const OPEN = ['PENDING', 'CONFIRMED', 'PROCESSING'];

export function StatusBreakdown({ byStatus, loading }: { byStatus?: Record<string, number>; loading?: boolean }) {
    const counts = PIPELINE.map((s) => ({ ...s, n: byStatus?.[s.key] ?? 0 }));
    const max = Math.max(1, ...counts.map((c) => c.n));
    const total = counts.reduce((a, c) => a + c.n, 0);

    return (
        <section className="flex flex-col rounded-xl border border-gray-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-gray-700/70 dark:bg-gray-800">
            <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Order pipeline</h2>
                <span className="text-xs text-gray-500 tabular-nums dark:text-gray-400">{loading ? '' : `${total} all-time`}</span>
            </div>
            <ul className="mt-4 flex-1 space-y-3">
                {counts.map((c) => (
                    <li key={c.key}>
                        <Link href={`/orders?status=${c.key}`} className="group block">
                            <div className="flex items-center justify-between text-[13px]">
                                <span className={`font-medium ${c.n ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'} group-hover:text-blue-600 dark:group-hover:text-blue-400`}>
                                    {c.label}
                                    {OPEN.includes(c.key) && c.n > 0 && (
                                        <span className="ml-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">to fulfil</span>
                                    )}
                                </span>
                                <span className="font-semibold text-gray-900 tabular-nums dark:text-white">{loading ? '—' : c.n}</span>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700/60">
                                <div
                                    className={`h-full rounded-full transition-[width] duration-500 ${['CANCELLED', 'REFUNDED'].includes(c.key) ? 'bg-gray-300 dark:bg-gray-500' : 'bg-blue-600 dark:bg-blue-400'}`}
                                    style={{ width: loading ? 0 : `${(c.n / max) * 100}%` }}
                                />
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
