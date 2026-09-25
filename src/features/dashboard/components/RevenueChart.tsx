// src/features/dashboard/components/RevenueChart.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { OrderStatsDay } from '@/types/order.types';
import { formatMoney } from '@/features/orders/components/OrderTable';

type Metric = 'revenue' | 'orders';

const H = 240;
const PAD = { top: 12, right: 12, bottom: 28, left: 56 };

const compactKes = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);

const dayLabel = (iso: string, long = false) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-KE', long ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' });

/** "Nice" axis max + 4 even ticks. */
function niceTicks(max: number): number[] {
    if (max <= 0) return [0, 1, 2, 3, 4];
    const raw = max / 4;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
    return [0, 1, 2, 3, 4].map((i) => i * step);
}

export function RevenueChart({ daily, loading, period = 'last 30 days', note = 'Paid orders only' }: { daily?: OrderStatsDay[]; loading?: boolean; period?: string; note?: string }) {
    const [metric, setMetric] = useState<Metric>('revenue');
    const [hover, setHover] = useState<number | null>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(640);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, e.contentRect.width)));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const data = useMemo(() => daily ?? [], [daily]);
    const values = data.map((d) => d[metric]);
    const ticks = niceTicks(Math.max(0, ...values));
    const yMax = ticks[ticks.length - 1] || 1;
    const innerW = width - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const x = (i: number) => PAD.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = (v: number) => PAD.top + innerH - (v / yMax) * innerH;

    const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
    const area = values.length ? `${line}L${x(values.length - 1)},${y(0)}L${x(0)},${y(0)}Z` : '';
    const labelEvery = Math.ceil(data.length / Math.max(2, Math.floor(innerW / 90)));
    const total = values.reduce((a, b) => a + b, 0);
    const fmt = (v: number) => (metric === 'revenue' ? formatMoney(v) : `${v} order${v === 1 ? '' : 's'}`);

    const onMove = (e: React.PointerEvent<SVGRectElement>) => {
        if (!data.length) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const rel = (e.clientX - rect.left) / rect.width;
        setHover(Math.max(0, Math.min(data.length - 1, Math.round(rel * (data.length - 1)))));
    };

    const h = hover !== null ? data[hover] : null;

    return (
        <section className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-gray-700/70 dark:bg-gray-800">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {metric === 'revenue' ? 'Revenue' : 'Orders'} · {period}
                    </h2>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 tabular-nums dark:text-white">
                        {loading ? '—' : fmt(total)}
                    </p>
                    {metric === 'revenue' && note && <p className="text-xs text-gray-500 dark:text-gray-400">{note}</p>}
                </div>
                <div className="inline-flex rounded-lg bg-gray-100 p-0.5 text-xs font-medium dark:bg-gray-700/60" role="tablist">
                    {(['revenue', 'orders'] as const).map((m) => (
                        <button
                            key={m}
                            role="tab"
                            aria-selected={metric === m}
                            onClick={() => setMetric(m)}
                            className={`rounded-md px-3 py-1.5 capitalize transition ${metric === m
                                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            <div ref={wrapRef} className="relative mt-4">
                {loading ? (
                    <div className="h-[240px] animate-pulse rounded-lg bg-gray-50 dark:bg-gray-700/40" />
                ) : (
                    <svg width={width} height={H} role="img" aria-label={`${metric} per day for the ${period}, total ${fmt(total)}`} className="block text-blue-600 dark:text-blue-400">
                        <defs>
                            <linearGradient id="rev-fill" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {ticks.map((t) => (
                            <g key={t}>
                                <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)}
                                    className="stroke-gray-100 dark:stroke-gray-700" strokeDasharray={t === 0 ? undefined : '3 4'} />
                                <text x={PAD.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-gray-400 text-[11px] tabular-nums">
                                    {metric === 'revenue' ? compactKes(t) : t}
                                </text>
                            </g>
                        ))}

                        {data.map((d, i) =>
                            i % labelEvery === 0 || i === data.length - 1 ? (
                                <text key={d.date} x={x(i)} y={H - 8} textAnchor={i === data.length - 1 ? 'end' : i === 0 ? 'start' : 'middle'}
                                    className="fill-gray-400 text-[11px]">
                                    {i === data.length - 1 ? 'Today' : dayLabel(d.date)}
                                </text>
                            ) : null,
                        )}

                        <path d={area} fill="url(#rev-fill)" />
                        <path d={line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

                        {h && hover !== null && (
                            <g pointerEvents="none">
                                <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={y(0)} className="stroke-gray-300 dark:stroke-gray-600" />
                                <circle cx={x(hover)} cy={y(values[hover])} r={5} fill="currentColor" className="stroke-white dark:stroke-gray-800" strokeWidth={2} />
                            </g>
                        )}

                        <rect x={PAD.left} y={PAD.top} width={innerW} height={innerH} fill="transparent"
                            onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
                    </svg>
                )}

                {h && hover !== null && (
                    <div
                        className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-gray-700 dark:bg-gray-900"
                        style={{ left: Math.min(Math.max(x(hover), 90), width - 90) }}
                    >
                        <p className="font-medium text-gray-500 dark:text-gray-400">{dayLabel(h.date, true)}</p>
                        <p className="mt-0.5 font-semibold text-gray-900 tabular-nums dark:text-white">{formatMoney(h.revenue)}</p>
                        <p className="text-gray-500 dark:text-gray-400">{h.orders} order{h.orders === 1 ? '' : 's'}</p>
                    </div>
                )}
            </div>
        </section>
    );
}
