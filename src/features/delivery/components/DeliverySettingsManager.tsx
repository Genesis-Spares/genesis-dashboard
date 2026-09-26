'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Check, Loader2, Pencil, Plus, Receipt, Trash2, Truck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { Btn, Modal, errMsg, fieldCls, labelCls } from '@/features/orders/components/OrderDialogs';
import { usePermissions } from '@/lib/hooks/usePermissions';
import {
    useCheckoutSettings,
    useDeleteDeliveryZone,
    useDeliveryZones,
    useSaveDeliveryZone,
    useUpdateCheckoutSettings,
} from '../hooks/useDelivery';
import type { DeliveryZone, DeliveryZoneInput } from '../api/delivery.api';

const ksh = (v: string | number) => (Number(v) === 0 ? 'Free' : `KSh ${Number(v).toLocaleString('en-KE')}`);
const title = (c: string) => c.replace(/\b\w/g, (m) => m.toUpperCase());

function eta(z: { minDays: number; maxDays: number }) {
    if (z.maxDays <= 0) return 'Same day';
    if (z.minDays <= 0) return `Same day – ${z.maxDays}d`;
    return z.minDays === z.maxDays ? `${z.minDays}d` : `${z.minDays}–${z.maxDays}d`;
}

export default function DeliverySettingsManager() {
    const { can } = usePermissions();
    const canEdit = can({ permission: 'settings:update' });
    const { data: zones, isLoading } = useDeliveryZones();
    const deleteZone = useDeleteDeliveryZone();

    const [editing, setEditing] = useState<DeliveryZone | 'new' | null>(null);
    const [deleting, setDeleting] = useState<DeliveryZone | null>(null);

    const confirmDelete = () =>
        deleting &&
        deleteZone.mutate(deleting.id, {
            onSuccess: () => {
                toast.success(`Deleted ${deleting.name}`);
                setDeleting(null);
            },
            onError: (e) => toast.error(errMsg(e, 'Could not delete the zone.')),
        });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                    <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" /> Delivery &amp; VAT
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    What checkout charges for delivery and tax. The shopper&apos;s town picks the zone; towns no zone lists use the default zone.
                </p>
            </div>

            <VatCard canEdit={canEdit} />

            <Card className="p-0">
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                    <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">Delivery zones</div>
                        <div className="text-sm text-gray-500">Changes apply to new checkouts immediately.</div>
                    </div>
                    {canEdit && (
                        <Button onClick={() => setEditing('new')} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-1 h-4 w-4" /> Add zone
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-16 text-gray-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : !zones?.length ? (
                    <div className="py-16 text-center text-sm text-gray-400">
                        No delivery zones yet — checkout can&apos;t deliver anywhere until you add one.
                    </div>
                ) : (
                    <div className="relative overflow-x-auto">
                        <table className="w-full min-w-[820px] text-left text-sm responsive-table">
                            <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Zone</th>
                                    <th className="px-3 py-3 font-medium">Towns</th>
                                    <th className="px-3 py-3 font-medium">Fee</th>
                                    <th className="px-3 py-3 font-medium">Weight</th>
                                    <th className="px-3 py-3 font-medium">Free over</th>
                                    <th className="px-3 py-3 font-medium">ETA</th>
                                    <th className="px-3 py-3 font-medium">COD</th>
                                    {canEdit && <th className="px-6 py-3" />}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {zones.map((z) => (
                                    <tr key={z.id} className={z.isActive ? '' : 'opacity-50'}>
                                        <td className="px-6 py-3.5 rt-full">
                                            <div className="font-medium text-gray-900 dark:text-gray-100">{z.name}</div>
                                            <div className="mt-0.5 flex gap-1.5">
                                                {z.isDefault && <Tag tone="blue">Default</Tag>}
                                                {!z.isActive && <Tag tone="gray">Inactive</Tag>}
                                            </div>
                                        </td>
                                        <td data-label="Towns" className="max-w-[260px] px-3 py-3.5 text-gray-600 dark:text-gray-300">
                                            {z.cities.length ? (
                                                <span title={z.cities.map(title).join(', ')}>
                                                    {z.cities.slice(0, 4).map(title).join(', ')}
                                                    {z.cities.length > 4 && <span className="text-gray-400"> +{z.cities.length - 4} more</span>}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">All other towns</span>
                                            )}
                                        </td>
                                        <td data-label="Fee" className="px-3 py-3.5 font-medium text-gray-900 dark:text-gray-100">{ksh(z.fee)}</td>
                                        <td data-label="Weight" className="px-3 py-3.5 text-gray-600 dark:text-gray-300">
                                            {Number(z.perKgFee) > 0 ? `KSh ${Number(z.perKgFee)}/kg over ${Number(z.includedKg)} kg` : '—'}
                                        </td>
                                        <td data-label="Free over" className="px-3 py-3.5 text-gray-600 dark:text-gray-300">
                                            {z.freeAbove != null ? `KSh ${Number(z.freeAbove).toLocaleString('en-KE')}` : '—'}
                                        </td>
                                        <td data-label="ETA" className="px-3 py-3.5 text-gray-600 dark:text-gray-300">{eta(z)}</td>
                                        <td data-label="COD" className="px-3 py-3.5">{z.allowsCod ? <Check className="h-4 w-4 text-green-600" /> : <span className="text-gray-300">—</span>}</td>
                                        {canEdit && (
                                            <td className="px-6 py-3.5 text-right rt-actions">
                                                <div className="flex justify-end gap-1">
                                                    <Button size="sm" variant="ghost" onClick={() => setEditing(z)} aria-label={`Edit ${z.name}`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => setDeleting(z)} aria-label={`Delete ${z.name}`}
                                                        className="text-gray-400 hover:text-red-500">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {editing && <ZoneDialog zone={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}

            <DeleteConfirmationModal
                isOpen={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={confirmDelete}
                isDeleting={deleteZone.isPending}
                title="Delete delivery zone"
                message={deleting?.isDefault
                    ? `"${deleting.name}" is the default zone. Without a default, checkout refuses towns that no zone lists.`
                    : `Delete "${deleting?.name}"? Its towns will use the default zone.`}
            />
        </div>
    );
}

function VatCard({ canEdit }: { canEdit: boolean }) {
    const { data } = useCheckoutSettings();
    const update = useUpdateCheckoutSettings();
    const [rate, setRate] = useState('');
    const [onShipping, setOnShipping] = useState(true);

    useEffect(() => {
        if (data) {
            setRate(String(data.vatRate));
            setOnShipping(data.vatOnShipping);
        }
    }, [data]);

    const parsed = Number(rate);
    const valid = rate.trim() !== '' && parsed >= 0 && parsed <= 100;
    const dirty = !!data && (parsed !== data.vatRate || onShipping !== data.vatOnShipping);

    const save = () =>
        update.mutate(
            { vatRate: parsed, vatOnShipping: onShipping },
            {
                onSuccess: () => toast.success('VAT settings saved'),
                onError: (e) => toast.error(errMsg(e, 'Could not save VAT settings.')),
            },
        );

    return (
        <Card className="p-6">
            <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" /> VAT
            </div>
            <p className="mt-1 text-sm text-gray-500">Added on top of product prices at checkout and stored on each order.</p>
            <div className="mt-5 flex flex-wrap items-end gap-6">
                <div className="w-36">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="vat-rate">Rate (%)</label>
                    <Input id="vat-rate" type="number" min={0} max={100} step="0.01" value={rate} disabled={!canEdit}
                        onChange={(e) => setRate(e.target.value)} />
                </div>
                <label className="flex items-center gap-3 pb-2 text-sm text-gray-700 dark:text-gray-300">
                    <Switch checked={onShipping} onCheckedChange={setOnShipping} disabled={!canEdit} />
                    Charge VAT on delivery fees too
                </label>
                {canEdit && (
                    <Button onClick={save} disabled={!valid || !dirty || update.isPending} className="bg-blue-600 hover:bg-blue-700">
                        {update.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Save'}
                    </Button>
                )}
            </div>
            {data?.updatedBy && (
                <p className="mt-3 text-xs text-gray-400">
                    Last changed by {data.updatedBy}{data.updatedAt ? ` on ${new Date(data.updatedAt).toLocaleString('en-KE')}` : ''}
                </p>
            )}
        </Card>
    );
}

type Form = Record<'name' | 'description' | 'cities' | 'fee' | 'perKgFee' | 'includedKg' | 'freeAbove' | 'minDays' | 'maxDays' | 'sortOrder', string>
    & { isDefault: boolean; allowsCod: boolean; isActive: boolean };

const toForm = (z: DeliveryZone | null): Form => ({
    name: z?.name ?? '',
    description: z?.description ?? '',
    cities: (z?.cities ?? []).map(title).join(', '),
    fee: z ? String(Number(z.fee)) : '',
    perKgFee: z ? String(Number(z.perKgFee)) : '0',
    includedKg: z ? String(Number(z.includedKg)) : '0',
    freeAbove: z?.freeAbove != null ? String(Number(z.freeAbove)) : '',
    minDays: String(z?.minDays ?? 1),
    maxDays: String(z?.maxDays ?? 3),
    sortOrder: String(z?.sortOrder ?? 0),
    isDefault: z?.isDefault ?? false,
    allowsCod: z?.allowsCod ?? false,
    isActive: z?.isActive ?? true,
});

function ZoneDialog({ zone, onClose }: { zone: DeliveryZone | null; onClose: () => void }) {
    const save = useSaveDeliveryZone();
    const [f, setF] = useState<Form>(() => toForm(zone));
    const [error, setError] = useState<string | null>(null);
    const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
    const toggle = (k: 'isDefault' | 'allowsCod' | 'isActive') => (v: boolean) => setF((s) => ({ ...s, [k]: v }));

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const body: DeliveryZoneInput = {
            name: f.name.trim(),
            description: f.description.trim() || undefined,
            cities: f.cities.split(/[,\n]/).map((c) => c.trim()).filter(Boolean),
            isDefault: f.isDefault,
            fee: Number(f.fee),
            perKgFee: Number(f.perKgFee || 0),
            includedKg: Number(f.includedKg || 0),
            freeAbove: f.freeAbove.trim() ? Number(f.freeAbove) : null,
            minDays: Number(f.minDays),
            maxDays: Number(f.maxDays),
            allowsCod: f.allowsCod,
            isActive: f.isActive,
            sortOrder: Number(f.sortOrder || 0),
        };
        save.mutate(
            { id: zone?.id, body },
            {
                onSuccess: () => {
                    toast.success(zone ? `Saved ${body.name}` : `Added ${body.name}`);
                    onClose();
                },
                onError: (err) => setError(errMsg(err, 'Could not save the zone.')),
            },
        );
    };

    const num = (k: keyof Form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
        <div>
            <label className={labelCls} htmlFor={`z-${k}`}>{label}</label>
            <input id={`z-${k}`} type="number" min={0} className={fieldCls} value={f[k] as string} onChange={set(k)} {...props} />
        </div>
    );

    return (
        <Modal
            open
            onClose={onClose}
            title={zone ? `Edit ${zone.name}` : 'Add delivery zone'}
            subtitle="Fees are in KSh, before VAT."
            footer={
                <>
                    <Btn type="button" onClick={onClose}>Cancel</Btn>
                    <Btn tone="primary" type="submit" form="zone-form" disabled={save.isPending}>
                        {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save zone
                    </Btn>
                </>
            }
        >
            <form id="zone-form" onSubmit={submit} className="space-y-4">
                {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</div>}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className={labelCls} htmlFor="z-name">Name</label>
                        <input id="z-name" required maxLength={80} className={fieldCls} value={f.name} onChange={set('name')} placeholder="e.g. Coast" />
                    </div>
                    <div>
                        <label className={labelCls} htmlFor="z-description">Description <span className="font-normal text-gray-400">(shown to shoppers)</span></label>
                        <input id="z-description" maxLength={200} className={fieldCls} value={f.description} onChange={set('description')} />
                    </div>
                </div>
                <div>
                    <label className={labelCls} htmlFor="z-cities">Towns <span className="font-normal text-gray-400">(comma or new line separated)</span></label>
                    <textarea id="z-cities" rows={3} className={fieldCls} value={f.cities} onChange={set('cities')}
                        placeholder={f.isDefault ? 'Optional for the default zone' : 'Mombasa, Kilifi, Diani'} />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {num('fee', 'Fee', { required: true, step: '0.01' })}
                    {num('perKgFee', 'Per extra kg', { step: '0.01' })}
                    {num('includedKg', 'Included kg', { step: '0.1' })}
                    {num('freeAbove', 'Free over', { step: '0.01', placeholder: 'Never' })}
                    {num('minDays', 'Min days', { required: true, max: 60 })}
                    {num('maxDays', 'Max days', { required: true, max: 60 })}
                    {num('sortOrder', 'Sort order', { min: undefined })}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1 text-sm text-gray-700 dark:text-gray-300">
                    <label className="flex items-center gap-2.5"><Switch checked={f.allowsCod} onCheckedChange={toggle('allowsCod')} /> Pay on delivery</label>
                    <label className="flex items-center gap-2.5"><Switch checked={f.isDefault} onCheckedChange={toggle('isDefault')} /> Default zone</label>
                    <label className="flex items-center gap-2.5"><Switch checked={f.isActive} onCheckedChange={toggle('isActive')} /> Active</label>
                </div>
            </form>
        </Modal>
    );
}

function Tag({ tone, children }: { tone: 'blue' | 'gray'; children: React.ReactNode }) {
    const cls = tone === 'blue'
        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
    return <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${cls}`}>{children}</span>;
}
