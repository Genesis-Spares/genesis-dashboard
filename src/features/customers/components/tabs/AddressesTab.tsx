'use client';

import { useState } from 'react';
import { PlusIcon, TrashIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { AddressType } from '@/types/customer.types';

interface Address {
    id: string;
    label: string;
    type: AddressType;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone?: string;
    isDefault: boolean;
    deliveryInstructions?: string;
}

interface AddressesTabProps {
    addresses: Address[];
    canManage: boolean;
    onAddAddress: (data: any, onSuccess?: () => void) => void;  // Allow optional callback
    onDeleteAddress: (id: string) => void;
    isAdding: boolean;
    isDeleting?: boolean;
}

const inputClass =
    'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500';

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

export function AddressesTab({
    addresses,
    canManage,
    onAddAddress,
    onDeleteAddress,
    isAdding,
    isDeleting = false
}: AddressesTabProps) {
    const [showForm, setShowForm] = useState(false);
    const [draft, setDraft] = useState({
        label: '',
        type: 'SHIPPING' as AddressType,
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        phone: '',
        isDefault: false,
        deliveryInstructions: '',
    });

    const handleAdd = () => {
        // Call the mutate function with just the data, let parent handle success
        onAddAddress(draft);
        // Reset form immediately (optimistic update)
        setShowForm(false);
        setDraft({
            label: '', type: 'SHIPPING', line1: '', line2: '', city: '', state: '',
            postalCode: '', country: '', phone: '', isDefault: false, deliveryInstructions: '',
        });
    };

    const handleRemove = (addressId: string) => {
        if (window.confirm('Remove this address?')) {
            onDeleteAddress(addressId);
        }
    };

    return (
        <InfoCard
            title={`Addresses (${addresses.length})`}
            action={
                canManage && (
                    <button
                        onClick={() => setShowForm((v) => !v)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Add Address
                    </button>
                )
            }
        >
            {showForm && (
                <div className="mb-5 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                            className={inputClass}
                            placeholder="Label (e.g. Home)"
                            value={draft.label}
                            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                        />
                        <select
                            className={inputClass}
                            value={draft.type}
                            onChange={(e) => setDraft({ ...draft, type: e.target.value as AddressType })}
                        >
                            <option value="SHIPPING">Shipping</option>
                            <option value="BILLING">Billing</option>
                            <option value="BOTH">Both</option>
                        </select>
                        <input
                            className={`${inputClass} sm:col-span-2`}
                            placeholder="Address line 1"
                            value={draft.line1}
                            onChange={(e) => setDraft({ ...draft, line1: e.target.value })}
                        />
                        <input
                            className={`${inputClass} sm:col-span-2`}
                            placeholder="Address line 2 (optional)"
                            value={draft.line2}
                            onChange={(e) => setDraft({ ...draft, line2: e.target.value })}
                        />
                        <input
                            className={inputClass}
                            placeholder="City"
                            value={draft.city}
                            onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                        />
                        <input
                            className={inputClass}
                            placeholder="State/Region"
                            value={draft.state}
                            onChange={(e) => setDraft({ ...draft, state: e.target.value })}
                        />
                        <input
                            className={inputClass}
                            placeholder="Postal code"
                            value={draft.postalCode}
                            onChange={(e) => setDraft({ ...draft, postalCode: e.target.value })}
                        />
                        <input
                            className={inputClass}
                            placeholder="Country"
                            value={draft.country}
                            onChange={(e) => setDraft({ ...draft, country: e.target.value })}
                        />
                        <input
                            className={inputClass}
                            placeholder="Phone (optional)"
                            value={draft.phone}
                            onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                        />
                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <input
                                type="checkbox"
                                checked={draft.isDefault}
                                onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })}
                            />
                            Set as default
                        </label>
                        <textarea
                            className={`${inputClass} sm:col-span-2`}
                            placeholder="Delivery instructions (optional)"
                            rows={2}
                            value={draft.deliveryInstructions}
                            onChange={(e) => setDraft({ ...draft, deliveryInstructions: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setShowForm(false)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={isAdding || !draft.label || !draft.line1 || !draft.city || !draft.postalCode || !draft.country}
                            className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
                        >
                            {isAdding ? 'Saving…' : 'Save Address'}
                        </button>
                    </div>
                </div>
            )}

            {addresses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                        <div key={address.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{address.label}</span>
                                    {address.isDefault && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/20">
                                            DEFAULT
                                        </span>
                                    )}
                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                        {address.type}
                                    </span>
                                </div>
                                {canManage && (
                                    <button
                                        onClick={() => handleRemove(address.id)}
                                        disabled={isDeleting}
                                        className="text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {address.line1}
                                {address.line2 ? `, ${address.line2}` : ''}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {address.city}{address.state ? `, ${address.state}` : ''} {address.postalCode}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{address.country}</p>
                            {address.phone && <p className="text-xs text-gray-400 mt-1">📞 {address.phone}</p>}
                            {address.deliveryInstructions && (
                                <p className="text-xs text-gray-400 mt-1 italic">📝 {address.deliveryInstructions}</p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-3">
                        <MapPinIcon className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No addresses saved.</p>
                    {canManage && (
                        <p className="text-xs text-gray-400 mt-1">Click "Add Address" to add one.</p>
                    )}
                </div>
            )}
        </InfoCard>
    );
}