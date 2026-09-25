'use client';

import { useEffect, useMemo, useState } from 'react';
import { Zap, Plus, Trash2, Search, Loader2, Check, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
    useFlashSale,
    useUpdateFlashSale,
    useAddFlashSaleItem,
    useRemoveFlashSaleItem,
} from '../hooks/useFlashSale';
import { useProducts } from '@/features/products/hooks/useProducts';

function toLocalInput(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function FlashSaleManager() {
    const { data, isLoading } = useFlashSale();
    const updateConfig = useUpdateFlashSale();
    const addItem = useAddFlashSaleItem();
    const removeItem = useRemoveFlashSaleItem();

    const [title, setTitle] = useState('');
    const [endsAt, setEndsAt] = useState('');
    const [savedFlag, setSavedFlag] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (data?.config) {
            setTitle(data.config.title ?? '');
            setEndsAt(toLocalInput(data.config.endsAt));
        }
    }, [data?.config]);

    const itemIds = useMemo(() => new Set((data?.items ?? []).map((i) => i.productId)), [data?.items]);
    const isActive = data?.config?.isActive ?? false;

    const { data: productsRes, isFetching: searching } = useProducts(
        search.trim() ? { search: search.trim(), limit: 8, isActive: true } : { limit: 8, isActive: true },
    );
    const searchResults = productsRes?.data ?? [];

    const toggleActive = (checked: boolean) => updateConfig.mutate({ isActive: checked });

    const saveConfig = () =>
        updateConfig.mutate(
            { title: title.trim() || 'Flash Deals', endsAt: endsAt ? new Date(endsAt).toISOString() : null },
            {
                onSuccess: () => {
                    setSavedFlag(true);
                    setTimeout(() => setSavedFlag(false), 2000);
                },
            },
        );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                        <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" /> Flash Sale
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Enable the flash-sale strip on the storefront and pick which products appear.
                    </p>
                </div>
            </div>

            {/* config */}
            <Card className="p-6">
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-5 dark:border-gray-800">
                    <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">Show on storefront</div>
                        <div className="text-sm text-gray-500">
                            {isActive ? 'The flash sale is live for shoppers.' : 'The flash sale is hidden from shoppers.'}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                            {isActive ? 'Live' : 'Off'}
                        </span>
                        <Switch checked={isActive} onCheckedChange={toggleActive} disabled={updateConfig.isPending} />
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Flash Deals" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Ends at</label>
                        <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
                    </div>
                </div>
                <div className="mt-4">
                    <Button onClick={saveConfig} disabled={updateConfig.isPending} className="bg-blue-600 hover:bg-blue-700">
                        {updateConfig.isPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                        ) : savedFlag ? (
                            <><Check className="mr-2 h-4 w-4" /> Saved</>
                        ) : (
                            'Save changes'
                        )}
                    </Button>
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* add products */}
                <Card className="p-6">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">Add products</div>
                    <div className="relative mt-3">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="pl-9" />
                    </div>
                    <div className="mt-4 space-y-2">
                        {searching && <div className="py-6 text-center text-sm text-gray-400"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>}
                        {!searching && searchResults.length === 0 && (
                            <div className="py-6 text-center text-sm text-gray-400">No products found.</div>
                        )}
                        {!searching && searchResults.map((p) => {
                            const inSale = itemIds.has(p.id);
                            return (
                                <div key={p.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-2.5 dark:border-gray-800">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-50 dark:bg-gray-800">
                                        <Package className="h-5 w-5 text-gray-300" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</div>
                                        <div className="text-xs text-gray-400">{p.sku} · KSh {Number(p.price).toLocaleString()}</div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={inSale ? 'outline' : 'default'}
                                        disabled={inSale || addItem.isPending}
                                        onClick={() => addItem.mutate({ productId: p.id })}
                                        className={inSale ? '' : 'bg-blue-600 hover:bg-blue-700'}
                                    >
                                        {inSale ? 'Added' : <><Plus className="mr-1 h-3.5 w-3.5" /> Add</>}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* current items */}
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">In the flash sale</div>
                        <span className="text-sm text-gray-400">{data?.items.length ?? 0} product{(data?.items.length ?? 0) !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="mt-4 space-y-2">
                        {(data?.items ?? []).length === 0 && (
                            <div className="py-6 text-center text-sm text-gray-400">No products added yet.</div>
                        )}
                        {(data?.items ?? []).map((it) => (
                            <div key={it.productId} className="flex items-center gap-3 rounded-lg border border-gray-100 p-2.5 dark:border-gray-800">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-50 dark:bg-gray-800">
                                    <Package className="h-5 w-5 text-gray-300" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {it.product?.name ?? it.productId}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {it.product?.sku ?? ''}{it.product ? ` · KSh ${Number(it.product.price).toLocaleString()}` : ''}
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={removeItem.isPending}
                                    onClick={() => removeItem.mutate(it.productId)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
