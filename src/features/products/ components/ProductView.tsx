'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ArrowLeftIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { Product } from '@/types/product.types';
import { ReviewsModeration } from '@/features/reviews/components/ReviewsModeration';
import { MovementsTab } from '@/features/inventory/components/MovementsTab';
import { ProductOrdersTab } from './ProductOrdersTab';

interface ProductViewProps {
    product: Product;
    onBack: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onStatusChange?: (isActive: boolean) => void;
    isDeleting?: boolean;
}

type TabId = 'overview' | 'variants' | 'attributes' | 'orders' | 'stock' | 'reviews' | 'seo';

function formatPrice(value?: number) {
    if (value === undefined || value === null) return '—';
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        maximumFractionDigits: 0,
    }).format(value);
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                {title}
            </h3>
            {children}
        </div>
    );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
            <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{value}</span>
        </div>
    );
}

function StatBlock({ value, label }: { value: React.ReactNode; label: string }) {
    return (
        <div className="flex flex-col items-center text-center gap-1 px-4">
            <span className="text-xl font-bold">{value}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        </div>
    );
}

export function ProductView({ product, onBack, onEdit, onDelete, onStatusChange, isDeleting = false }: ProductViewProps) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const { can } = usePermissions();
    const canEdit = can({ permission: 'catalog:manage' });
    const canDelete = can({ permission: 'catalog:manage' });
    const canViewOrders = can({ permission: 'order:read' });
    const canManageStock = can({ permission: 'product:update' });

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const sortedImages = [...(product.images ?? [])].sort((a, b) => a.order - b.order);
    const activeImage = sortedImages[activeImageIndex] ?? sortedImages[0];

    const handleConfirmDelete = () => {
        onDelete();
        setDeleteModalOpen(false);
    };

    const tabs: { id: TabId; label: string }[] = [
        { id: 'overview', label: 'Overview' },
        ...(product.variants?.length ? [{ id: 'variants' as const, label: 'Variants' }] : []),
        ...(product.attributes?.length ? [{ id: 'attributes' as const, label: 'Attributes' }] : []),
        ...(canViewOrders ? [{ id: 'orders' as const, label: 'Orders' }] : []),
        ...(canManageStock ? [{ id: 'stock' as const, label: 'Stock history' }] : []),
        { id: 'reviews', label: `Reviews (${product.ratingCount ?? product.reviewCount ?? 0})` },
        { id: 'seo', label: 'SEO' },
    ];

    return (
        <>
            <div className="space-y-0">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-4">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                        <button
                            onClick={onBack}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                            Back
                        </button>
                        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">
                            {product.name}
                        </h1>
                        <span className="text-sm text-gray-400">
                            Product #{product.sku}
                        </span>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <button
                                onClick={onEdit}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                Edit
                            </button>
                        )}

                        {(canDelete || (onStatusChange && canEdit)) && (
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
                                        {onStatusChange && canEdit && (
                                            <button
                                                onClick={() => {
                                                    onStatusChange(!product.isActive);
                                                    setMenuOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                                            >
                                                {product.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() => {
                                                    setDeleteModalOpen(true);
                                                    setMenuOpen(false);
                                                }}
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

                {/* Full-width tab strip */}
                <div className="border-b border-gray-100 dark:border-gray-800 flex gap-6 relative overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-1 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="pt-6 space-y-6">
                    {activeTab === 'overview' && (
                        <>
                            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 py-8">
                                <div className="flex flex-wrap justify-around gap-y-6">
                                    <StatBlock value={formatPrice(product.price)} label="Price" />
                                    <StatBlock
                                        value={<span className={product.isInStock ? '' : 'text-red-500'}>{product.stockQty}</span>}
                                        label="Stock Qty"
                                    />
                                    <StatBlock
                                        value={product.averageRating ? product.averageRating.toFixed(1) : '0.0'}
                                        label="Avg Rating"
                                    />
                                    <StatBlock value={product.reviewCount ?? 0} label="Reviews" />
                                    <StatBlock value={product.variants?.length ?? 0} label="Variants" />
                                    <StatBlock value={product.isInStock ? 'Yes' : 'No'} label="In Stock" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800">
                                            {activeImage ? (
                                                <Image
                                                    src={activeImage.url}
                                                    alt={activeImage.alt ?? product.name}
                                                    fill
                                                    className="object-contain"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                                                    No image
                                                </div>
                                            )}
                                        </div>

                                        {sortedImages.length > 1 && (
                                            <div className="flex gap-2 mt-4 relative overflow-x-auto">
                                                {sortedImages.map((img, index) => (
                                                    <button
                                                        key={img.id}
                                                        onClick={() => setActiveImageIndex(index)}
                                                        className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${index === activeImageIndex ? 'border-blue-500' : 'border-transparent'
                                                            }`}
                                                    >
                                                        <Image src={img.url} alt={img.alt ?? ''} fill className="object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {product.description && (
                                        <InfoCard title="Description">
                                            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                                                {product.description}
                                            </p>
                                        </InfoCard>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <InfoCard title="Pricing">
                                        <Field label="Price" value={formatPrice(product.price)} />
                                        {product.comparePrice !== undefined && (
                                            <Field label="Compare-at" value={formatPrice(product.comparePrice)} />
                                        )}
                                        {product.costPrice !== undefined && (
                                            <Field label="Cost" value={formatPrice(product.costPrice)} />
                                        )}
                                    </InfoCard>

                                    <InfoCard title="Organization">
                                        <Field label="Brand" value={product.brand ?? '—'} />
                                        <Field label="Category" value={product.category?.name ?? '—'} />
                                        {product.weight !== undefined && <Field label="Weight" value={`${product.weight} kg`} />}
                                        {product.compatibility && <Field label="Compatibility" value={product.compatibility} />}
                                        {product.tags?.length > 0 && (
                                            <div className="pt-2">
                                                <span className="text-sm text-gray-500 dark:text-gray-400 block mb-2">Tags</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {product.tags.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </InfoCard>

                                    <InfoCard title="Timestamps">
                                        <Field label="Created" value={new Date(product.createdAt).toLocaleString()} />
                                        <Field label="Last updated" value={new Date(product.updatedAt).toLocaleString()} />
                                    </InfoCard>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'variants' && (
                        <InfoCard title={`Variants (${product.variants.length})`}>
                            <div className="relative overflow-x-auto">
                                <table className="w-full text-sm responsive-table">
                                    <thead>
                                        <tr className="text-left text-gray-400 border-b border-gray-100 dark:border-gray-800">
                                            <th className="py-2 pr-4 font-medium">SKU</th>
                                            <th className="py-2 pr-4 font-medium">Name</th>
                                            <th className="py-2 pr-4 font-medium">Price</th>
                                            <th className="py-2 pr-4 font-medium">Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {product.variants.map((variant) => (
                                            <tr key={variant.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
                                                <td data-label="SKU" className="py-2 pr-4 text-gray-500">{variant.sku}</td>
                                                <td className="py-2 pr-4 font-medium text-gray-800 dark:text-gray-100 rt-full">
                                                    {variant.name}
                                                </td>
                                                <td data-label="Price" className="py-2 pr-4">{formatPrice(variant.price)}</td>
                                                <td data-label="Stock" className="py-2 pr-4">{variant.stockQty}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </InfoCard>
                    )}

                    {activeTab === 'attributes' && (
                        <InfoCard title="Attributes">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                                {[...product.attributes]
                                    .sort((a, b) => a.displayOrder - b.displayOrder)
                                    .map((attr) => (
                                        <Field key={attr.id} label={attr.name} value={attr.value} />
                                    ))}
                            </div>
                        </InfoCard>
                    )}

                    {activeTab === 'orders' && canViewOrders && <ProductOrdersTab productId={product.id} />}
                    {activeTab === 'stock' && canManageStock && <MovementsTab productId={product.id} />}

                    {activeTab === 'reviews' && <ReviewsModeration productId={product.id} />}

                    {activeTab === 'seo' && (
                        <InfoCard title="SEO & Meta">
                            {product.metaTitle || product.metaDescription || product.metaKeywords ? (
                                <>
                                    {product.metaTitle && <Field label="Meta title" value={product.metaTitle} />}
                                    {product.metaDescription && (
                                        <Field label="Meta description" value={product.metaDescription} />
                                    )}
                                    {product.metaKeywords && (
                                        <Field
                                            label="Meta keywords"
                                            value={Array.isArray(product.metaKeywords) ? product.metaKeywords.join(', ') : product.metaKeywords}
                                        />
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-gray-400">No SEO metadata set for this product.</p>
                            )}
                        </InfoCard>
                    )}
                </div>
            </div>

            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
                title="Delete Product"
                itemName={product.name}
                confirmText="Delete"
            />
        </>
    );
}