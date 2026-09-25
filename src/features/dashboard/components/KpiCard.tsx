// src/features/dashboard/components/KpiCard.tsx
import Link from 'next/link';
import { ComponentType } from 'react';
import { ArrowDownRightIcon, ArrowUpRightIcon } from '@heroicons/react/20/solid';

interface KpiCardProps {
    label: string;
    value: string | number;
    icon: ComponentType<{ className?: string }>;
    /** Current vs previous period; renders a % change chip when both are given. */
    current?: number;
    previous?: number;
    sub?: React.ReactNode;
    /** What the comparison is against, e.g. "prior 30d". */
    compareLabel?: string;
    href?: string;
    tone?: 'default' | 'warning';
    loading?: boolean;
}

export function KpiCard({ label, value, icon: Icon, current, previous, sub, compareLabel = 'prior 30d', href, tone = 'default', loading }: KpiCardProps) {
    const body = (
        <>
            <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400">{label}</span>
                <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone === 'warning'
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700/60 dark:text-gray-300'
                        }`}
                >
                    <Icon className="h-4 w-4" />
                </span>
            </div>
            {loading ? (
                <div className="mt-3 h-8 w-28 animate-pulse rounded-md bg-gray-100 dark:bg-gray-700" />
            ) : (
                <p className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-gray-900 tabular-nums dark:text-white">
                    {value}
                </p>
            )}
            <div className="mt-2 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                {current !== undefined && previous !== undefined && !loading && <Delta current={current} previous={previous} against={compareLabel} />}
                {sub}
            </div>
        </>
    );

    const cls =
        'block rounded-xl border border-gray-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-gray-700/70 dark:bg-gray-800';
    return href ? (
        <Link href={href} className={`${cls} transition hover:border-gray-300 hover:shadow-sm dark:hover:border-gray-600`}>
            {body}
        </Link>
    ) : (
        <div className={cls}>{body}</div>
    );
}

function Delta({ current, previous, against }: { current: number; previous: number; against: string }) {
    if (previous === 0) {
        return current > 0 ? <span className="font-medium text-gray-600 dark:text-gray-300">New vs {against}</span> : null;
    }
    const pct = ((current - previous) / previous) * 100;
    const up = pct >= 0;
    const Arrow = up ? ArrowUpRightIcon : ArrowDownRightIcon;
    return (
        <span
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold ${up
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                }`}
            title={`vs ${against}`}
        >
            <Arrow className="h-3.5 w-3.5" />
            {Math.abs(pct).toFixed(pct !== 0 && Math.abs(pct) < 10 ? 1 : 0)}%
        </span>
    );
}
