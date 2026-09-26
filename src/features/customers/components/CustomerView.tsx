'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    ArrowLeftIcon,
    EllipsisHorizontalIcon,
    PlusIcon,
    TrashIcon,
    MapPinIcon,
    StarIcon as StarOutlineIcon,
    EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { usePermissions } from '@/lib/hooks/usePermissions';
import {
    useCustomerAddresses,
    useCustomerNotes,
    useCustomerPreferences,
    useCustomerActivities,
    useAddCustomerNote,
    useAddAddress,
    useDeleteAddress,
    useUpdateCustomerPreferences,
    useUpdateCustomerNote,
    useDeleteCustomerNote,
} from '@/features/customers/hooks/useCustomers';
import { Customer, NoteType, AddressType } from '@/types/customer.types';

// ============================================
// CHILD COMPONENTS
// ============================================

import { AddressesTab } from './tabs/AddressesTab';
import { NotesTab } from './tabs/NotesTab';
import { PreferencesTab } from './tabs/PreferencesTab';
import { ActivitiesTab } from './tabs/ActivitiesTab';
import { OverviewTab } from './tabs/OverviewTab';
import { OrdersTab } from './tabs/OrdersTab';
import { CartTab } from './tabs/CartTab';
import { EmailsTab } from './tabs/EmailsTab';
import { EmailComposer } from '@/features/emails/components/EmailComposer';

// ============================================
// TYPES & HELPERS
// ============================================

interface CustomerViewProps {
    customer: Customer;
    onBack: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onStatusChange?: (isActive: boolean) => void;
    isDeleting?: boolean;
}

type TabId = 'overview' | 'addresses' | 'notes' | 'preferences' | 'orders' | 'cart' | 'emails' | 'activities';

function initials(customer: Customer) {
    return `${customer.firstName?.[0] ?? ''}${customer.lastName?.[0] ?? ''}`.toUpperCase();
}

const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'addresses', label: 'Addresses' },
    { id: 'notes', label: 'Notes' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'orders', label: 'Orders' },
    { id: 'cart', label: 'Cart' },
    { id: 'emails', label: 'Emails' },
    { id: 'activities', label: 'Activities' },
];

// ============================================
// MAIN COMPONENT
// ============================================

export function CustomerView({
    customer,
    onBack,
    onEdit,
    onDelete,
    onStatusChange,
    isDeleting = false
}: CustomerViewProps) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [menuOpen, setMenuOpen] = useState(false);
    const [composing, setComposing] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const { can } = usePermissions();
    const canManage = can({ permission: 'customer:manage' });
    const canDelete = can({ permission: 'customer:delete' });
    const canEmail = can({ permission: 'message:create' });

    // Close menu on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Data fetching
    const { data: addresses } = useCustomerAddresses(customer.id);
    const { data: notes } = useCustomerNotes(customer.id);
    const { data: preferences } = useCustomerPreferences(customer.id);
    const { data: activities } = useCustomerActivities(customer.id, 50);

    // Mutations
    const addAddress = useAddAddress(customer.id);
    const deleteAddress = useDeleteAddress(customer.id);
    const addNote = useAddCustomerNote(customer.id);
    const updateNote = useUpdateCustomerNote(customer.id);  // Add this
    const deleteNote = useDeleteCustomerNote(customer.id);  // Add this

    const updatePreferences = useUpdateCustomerPreferences(customer.id);

    // Handlers
    const handleConfirmDelete = useCallback(() => {
        onDelete();
        setDeleteModalOpen(false);
    }, [onDelete]);

    const handleTabChange = useCallback((tabId: TabId) => {
        setActiveTab(tabId);
    }, []);

    const handleStatusToggle = useCallback(() => {
        if (onStatusChange) {
            onStatusChange(!customer.isActive);
            setMenuOpen(false);
        }
    }, [onStatusChange, customer.isActive]);

    const handleDeleteClick = useCallback(() => {
        setDeleteModalOpen(true);
        setMenuOpen(false);
    }, []);

    // Memoized computed values
    const fullName = useMemo(() =>
        `${customer.firstName} ${customer.lastName}`.trim(),
        [customer.firstName, customer.lastName]
    );

    const userInitials = useMemo(() => initials(customer), [customer]);

    const formattedLastLogin = useMemo(() =>
        customer.lastLoginAt ? new Date(customer.lastLoginAt).toLocaleDateString() : 'Never',
        [customer.lastLoginAt]
    );

    const isActive = customer.isActive;

    return (
        <>
            <div className="space-y-0">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-4">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                        {/* Back Button */}
                        <button
                            onClick={onBack}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                            Back
                        </button>
                        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />

                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center overflow-hidden shrink-0">
                            {customer.avatar ? (
                                <img src={customer.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-semibold">{userInitials}</span>
                            )}
                        </div>

                        {/* Name & Info */}
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{fullName}</h1>
                        <span className="text-sm text-gray-400 break-all">{customer.email}</span>

                        {/* Status */}
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {customer.loyaltyTier}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {canEmail && (
                            <button
                                onClick={() => setComposing(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <EnvelopeIcon className="w-4 h-4" />
                                Email
                            </button>
                        )}
                        {canManage && (
                            <button
                                onClick={onEdit}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                Edit
                            </button>
                        )}

                        {(canDelete || (onStatusChange && canManage)) && (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setMenuOpen((v) => !v)}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    aria-label="More actions"
                                >
                                    <EllipsisHorizontalIcon className="w-5 h-5 text-gray-500" />
                                </button>

                                {menuOpen && (
                                    <div className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg py-1 z-10">
                                        {onStatusChange && canManage && (
                                            <button
                                                onClick={handleStatusToggle}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                                            >
                                                {isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={handleDeleteClick}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab Strip */}
                <div className="border-b border-gray-100 dark:border-gray-800 flex gap-6 relative overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`px-1 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="pt-6 space-y-6">
                    {activeTab === 'overview' && (
                        <OverviewTab
                            customer={customer}
                            addressesCount={addresses?.length ?? 0}
                            notesCount={notes?.length ?? 0}
                            activitiesCount={activities?.length ?? 0}
                            formattedLastLogin={formattedLastLogin}
                        />
                    )}

                    {activeTab === 'addresses' && (
                        <AddressesTab
                            addresses={addresses ?? []}
                            canManage={canManage}
                            onAddAddress={addAddress.mutate}  // Pass the mutate function, not the entire object
                            onDeleteAddress={deleteAddress.mutate}  // Pass the mutate function
                            isAdding={addAddress.isPending}
                            isDeleting={deleteAddress.isPending}
                        />
                    )}

                    {activeTab === 'notes' && (
                        <NotesTab
                            notes={notes ?? []}
                            canManage={canManage}
                            onAddNote={addNote.mutate}
                            onUpdateNote={updateNote.mutate}   // Add this
                            onDeleteNote={deleteNote.mutate}
                            isAdding={addNote.isPending}
                            isUpdating={updateNote.isPending}   // Add this
                            isDeleting={deleteNote.isPending}   // Add this
                        />
                    )}

                    {activeTab === 'preferences' && (
                        <PreferencesTab
                            preferences={preferences as any}
                            canManage={canManage}
                            onUpdatePreferences={updatePreferences.mutate}
                            isUpdating={updatePreferences.isPending}
                        />
                    )}

                    {activeTab === 'orders' && (
                        <OrdersTab userId={customer.userId} />
                    )}

                    {activeTab === 'cart' && (
                        <CartTab userId={customer.userId} />
                    )}

                    {activeTab === 'emails' && (
                        <EmailsTab customerId={customer.id} onCompose={canEmail ? () => setComposing(true) : undefined} />
                    )}

                    {activeTab === 'activities' && (
                        <ActivitiesTab activities={activities ?? []} />
                    )}
                </div>
            </div>

            {composing && (
                <EmailComposer
                    draftId={null}
                    seed={{ recipients: [{ email: customer.email.toLowerCase(), name: fullName || undefined, customerId: customer.id }] }}
                    onClose={() => setComposing(false)}
                    onSent={() => setActiveTab('emails')}
                />
            )}

            {/* Delete Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
                title="Delete Customer"
                itemName={fullName}
                confirmText="Delete"
            />
        </>
    );
}