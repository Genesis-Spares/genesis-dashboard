'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { CheckBadgeIcon, EyeIcon, EyeSlashIcon, MagnifyingGlassIcon, StarIcon as StarOutline, TruckIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/20/solid';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useModerateReview, useReviews } from '../hooks/useReviews';
import { AdminReview, ReviewStatus } from '@/types/review.types';
import { Btn, Modal, fieldCls, labelCls } from '@/features/orders/components/OrderDialogs';

const errMsg = (e: unknown, fallback: string) => {
    const m = (e as { message?: string | string[] })?.message;
    return Array.isArray(m) ? m.join(', ') : m || fallback;
};

function Stars({ n }: { n: number }) {
    return (
        <span className="inline-flex" aria-label={`${n} of 5 stars`}>
            {[1, 2, 3, 4, 5].map((i) => <StarIcon key={i} className={`h-4 w-4 ${i <= n ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}`} />)}
        </span>
    );
}

const HIDE_REASONS = ['Offensive or abusive language', 'Personal information', 'Spam or advertising', 'Not about this product', 'Other'];

/**
 * Review moderation list. With `productId` it's scoped to one product (used in
 * the product view); otherwise it's the full /reviews page with filters.
 */
export function ReviewsModeration({ productId }: { productId?: string }) {
    const { can } = usePermissions();
    const canModerate = can({ permission: 'review:delete' });

    const [status, setStatus] = useState<ReviewStatus | ''>('');
    const [rating, setRating] = useState<number | ''>('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [hiding, setHiding] = useState<AdminReview | null>(null);

    const { data, isLoading } = useReviews({
        productId,
        status: status || undefined,
        rating: rating || undefined,
        search: search.trim() || undefined,
        page,
        limit: 20,
    });
    const moderate = useModerateReview();
    const reviews = data?.data ?? [];

    const publish = (r: AdminReview) =>
        moderate.mutate({ id: r.id, status: 'PUBLISHED' }, {
            onSuccess: () => toast.success('Review is visible again'),
            onError: (e) => toast.error(errMsg(e, 'Could not update the review.')),
        });

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                {!productId && (
                    <div className="relative min-w-[220px] flex-1">
                        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search product, reviewer, vehicle, text…"
                            className={`${fieldCls} pl-9`} />
                    </div>
                )}
                <select value={status} onChange={(e) => { setStatus(e.target.value as ReviewStatus | ''); setPage(1); }} className={`${fieldCls} w-auto`} aria-label="Status">
                    <option value="">All reviews</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="HIDDEN">Hidden</option>
                </select>
                <select value={rating} onChange={(e) => { setRating(e.target.value ? Number(e.target.value) : ''); setPage(1); }} className={`${fieldCls} w-auto`} aria-label="Rating">
                    <option value="">Any rating</option>
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n === 1 ? '' : 's'}</option>)}
                </select>
                <span className="ml-auto text-xs text-gray-500 tabular-nums">{data?.meta.total ?? 0} review{data?.meta.total === 1 ? '' : 's'}</span>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-gray-700/70 dark:bg-gray-800">
                {isLoading ? (
                    <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded bg-gray-50 dark:bg-gray-700/40" />)}</div>
                ) : reviews.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-5 py-14 text-center text-sm text-gray-500 dark:text-gray-400">
                        <StarOutline className="h-8 w-8 text-gray-300" />
                        No reviews{status || rating || search ? ' match these filters' : ' yet'}. Only customers with a delivered order can review a part.
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700/70">
                        {reviews.map((r) => (
                            <li key={r.id} className={`px-5 py-4 ${r.status === 'HIDDEN' ? 'bg-gray-50/80 dark:bg-gray-900/30' : ''}`}>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <Stars n={r.rating} />
                                            {r.title && <span className="text-sm font-semibold text-gray-900 dark:text-white">{r.title}</span>}
                                            {r.status === 'HIDDEN' && (
                                                <span className="inline-flex items-center gap-1 rounded bg-gray-200 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                    <EyeSlashIcon className="h-3 w-3" /> Hidden
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="font-medium text-gray-700 dark:text-gray-200">{r.userName}</span>
                                            {r.isVerified && <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400"><CheckBadgeIcon className="h-3.5 w-3.5" /> Verified</span>}
                                            <span>· {new Date(r.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            {!productId && r.product && (
                                                <span>· on <Link href={`/products/${r.product.id}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">{r.product.name}</Link></span>
                                            )}
                                            {r.orderId && <span>· <Link href={`/orders/${r.orderId}`} className="hover:text-blue-600">order</Link></span>}
                                        </p>
                                        {r.vehicle && (
                                            <p className={`mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${r.fitted === false ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}>
                                                <TruckIcon className="h-3.5 w-3.5" /> {r.fitted === false ? "Didn't fit" : r.fitted ? 'Fitted' : 'Used on'} {r.vehicle}
                                            </p>
                                        )}
                                        {r.content && <p className="mt-2 whitespace-pre-line text-sm text-gray-700 dark:text-gray-200">{r.content}</p>}
                                        {r.status === 'HIDDEN' && r.hiddenReason && <p className="mt-2 text-xs text-gray-500">Hidden: {r.hiddenReason}</p>}
                                    </div>
                                    {canModerate && (
                                        r.status === 'HIDDEN' ? (
                                            <Btn onClick={() => publish(r)} disabled={moderate.isPending}><EyeIcon className="h-4 w-4" /> Show again</Btn>
                                        ) : (
                                            <Btn onClick={() => setHiding(r)}><EyeSlashIcon className="h-4 w-4" /> Hide</Btn>
                                        )
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {data && data.meta.totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 text-sm">
                    <Btn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Btn>
                    <span className="text-gray-500 tabular-nums">{page} / {data.meta.totalPages}</span>
                    <Btn onClick={() => setPage((p) => p + 1)} disabled={page >= data.meta.totalPages}>Next</Btn>
                </div>
            )}

            {hiding && <HideDialog review={hiding} onClose={() => setHiding(null)} />}
        </div>
    );
}

function HideDialog({ review, onClose }: { review: AdminReview; onClose: () => void }) {
    const moderate = useModerateReview();
    const [reason, setReason] = useState(HIDE_REASONS[0]);
    const [other, setOther] = useState('');
    const final = reason === 'Other' ? other.trim() : reason;

    const submit = () =>
        moderate.mutate({ id: review.id, status: 'HIDDEN', reason: final }, {
            onSuccess: () => { toast.success('Review hidden'); onClose(); },
            onError: (e) => toast.error(errMsg(e, 'Could not hide the review.')),
        });

    return (
        <Modal open onClose={onClose} title="Hide review" subtitle="It disappears from the product page and stops counting toward the rating. You can show it again later."
            footer={<><Btn onClick={onClose}>Back</Btn><Btn tone="danger" onClick={submit} disabled={!final || moderate.isPending}>{moderate.isPending ? 'Hiding…' : 'Hide review'}</Btn></>}>
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-900/40 dark:text-gray-200">
                <Stars n={review.rating} /> {review.title && <strong className="ml-1">{review.title}</strong>}
                {review.content && <p className="mt-1 line-clamp-3 text-gray-600 dark:text-gray-300">{review.content}</p>}
            </div>
            <div>
                <label className={labelCls} htmlFor="hide-reason">Reason</label>
                <select id="hide-reason" className={fieldCls} value={reason} onChange={(e) => setReason(e.target.value)}>
                    {HIDE_REASONS.map((r) => <option key={r}>{r}</option>)}
                </select>
            </div>
            {reason === 'Other' && (
                <div>
                    <label className={labelCls} htmlFor="hide-other">Describe the reason</label>
                    <input id="hide-other" className={fieldCls} value={other} maxLength={300} onChange={(e) => setOther(e.target.value)} autoFocus />
                </div>
            )}
            <p className="text-xs text-gray-500">Tip: don&apos;t hide a review just because it&apos;s negative — honest low ratings build trust. Reply to the customer instead.</p>
        </Modal>
    );
}
