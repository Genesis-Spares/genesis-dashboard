'use client';

import Link from 'next/link';
import { ArrowPathIcon, ExclamationTriangleIcon, InformationCircleIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCustomerCart } from '../../hooks/useCustomers';
import { formatMoney } from '@/features/orders/components/OrderTable';

const ago = (iso: string) => {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 60) return `${Math.max(1, mins)}m ago`;
    if (mins < 48 * 60) return `${Math.round(mins / 60)}h ago`;
    return `${Math.round(mins / 1440)}d ago`;
};

export function CartTab({ userId }: { userId: string }) {
    const { data: cart, isLoading, isError, refetch, isFetching } = useCustomerCart(userId);

    if (isLoading) {
        return <div className="space-y-2">{[0, 1].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-50 dark:bg-gray-800" />)}</div>;
    }

    if (isError || !cart) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 py-12 text-center dark:border-rose-900/30 dark:bg-rose-900/10">
                <ExclamationTriangleIcon className="h-6 w-6 text-rose-400" />
                <p className="text-sm text-rose-600 dark:text-rose-400">Couldn&apos;t load this customer&apos;s cart.</p>
                <button onClick={() => refetch()} className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    <ArrowPathIcon className="h-4 w-4" /> Retry
                </button>
            </div>
        );
    }

    const note = (
        <p className="flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <InformationCircleIcon className="mt-px h-4 w-4 shrink-0" />
            Shows the cart saved while the customer is signed in. Items added as a guest stay in their browser until they sign in.
        </p>
    );

    if (cart.items.length === 0) {
        return (
            <div className="space-y-3">
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 py-14 text-center dark:border-gray-700">
                    <ShoppingCartIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cart is empty.</p>
                </div>
                {note}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-gray-700/70 dark:bg-gray-800">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700/70">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {cart.itemCount} item{cart.itemCount === 1 ? '' : 's'} in cart
                        {cart.updatedAt && <span className="ml-2 text-xs font-normal text-gray-500">· updated {ago(cart.updatedAt)}</span>}
                    </p>
                    <button onClick={() => refetch()} disabled={isFetching} aria-label="Refresh cart"
                        className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-gray-700">
                        <ArrowPathIcon className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <ul className="divide-y divide-gray-100 dark:divide-gray-700/70">
                    {cart.items.map((i) => {
                        const short = i.product.stockQty < i.quantity;
                        const unavailable = !i.product.isActive || !i.product.isInStock || i.product.stockQty === 0;
                        return (
                            <li key={i.productId} className="flex items-center gap-3 px-4 py-3">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    {i.product.image
                                        // eslint-disable-next-line @next/next/no-img-element
                                        ? <img src={i.product.image} alt="" className="h-full w-full object-contain p-1" />
                                        : <ShoppingCartIcon className="h-5 w-5 text-gray-300" />}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <Link href={`/products/${i.productId}`} className="block truncate text-[13px] font-medium text-gray-900 hover:text-blue-600 dark:text-white">{i.product.name}</Link>
                                    <p className="text-xs text-gray-400">
                                        <span className="font-mono">{i.product.sku}</span> · added {ago(i.addedAt)}
                                        {unavailable
                                            ? <span className="ml-1.5 font-medium text-rose-600 dark:text-rose-400">· {i.product.isActive ? 'Out of stock' : 'Unlisted'}</span>
                                            : short && <span className="ml-1.5 font-medium text-amber-600 dark:text-amber-400">· only {i.product.stockQty} in stock</span>}
                                    </p>
                                </div>
                                <span className="text-xs text-gray-500 tabular-nums">{i.quantity} × {formatMoney(i.unitPrice)}</span>
                                <span className="w-28 text-right text-[13px] font-semibold text-gray-900 tabular-nums dark:text-white">{formatMoney(i.lineTotal)}</span>
                            </li>
                        );
                    })}
                </ul>
                <div className="flex justify-between border-t border-gray-100 bg-gray-50/60 px-4 py-3 text-sm font-semibold text-gray-900 dark:border-gray-700/70 dark:bg-gray-900/20 dark:text-white">
                    <span>Subtotal (current prices)</span>
                    <span className="tabular-nums">{formatMoney(cart.subtotal)}</span>
                </div>
            </div>
            {note}
        </div>
    );
}
