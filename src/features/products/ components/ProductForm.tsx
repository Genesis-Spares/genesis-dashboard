'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    ArrowLeftIcon,
    PlusIcon,
    TrashIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { useImageUpload } from '@/features/categories/hooks/useCategories'; // generic cloudinary upload hook
import {
    CreateProductPayload,
    Product,
    ProductAttribute,
    ProductImage,
    ProductVariant,
    ProductFitment,
    ProductPartNumber,
} from '@/types/product.types';
import { FitmentEditor } from './FitmentEditor';
import { PartNumbersEditor } from './PartNumbersEditor';

interface ProductFormProps {
    mode: 'create' | 'edit';
    initialData?: Product;
    onSubmit: (payload: CreateProductPayload) => void;
    isSubmitting?: boolean;
    serverError?: string | null;
}

type ImageDraft = Omit<ProductImage, 'id'>;
type VariantDraft = Omit<ProductVariant, 'id'>;
type AttributeDraft = Omit<ProductAttribute, 'id'>;

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

function parseOptionalNumber(val: any): number | undefined {
    if (val === undefined || val === null || val === '') return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
}

function parseNumber(val: any, fallback = 0): number {
    if (val === undefined || val === null || val === '') return fallback;
    const num = Number(val);
    return isNaN(num) ? fallback : num;
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <div className="mb-5">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
                {description && <p className="text-sm text-gray-400 mt-0.5">{description}</p>}
            </div>
            {children}
        </div>
    );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
            {children}
            {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
    );
}

const inputClass =
    'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500';

export function ProductForm({ mode, initialData, onSubmit, isSubmitting = false, serverError }: ProductFormProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: categoriesData } = useCategories({ limit: 100 });
    const uploadImage = useImageUpload();

    const [slugTouched, setSlugTouched] = useState(mode === 'edit');
    const [tagInput, setTagInput] = useState('');
    const [metaKeywordInput, setMetaKeywordInput] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [form, setForm] = useState<CreateProductPayload>(() => ({
        sku: initialData?.sku ?? '',
        name: initialData?.name ?? '',
        slug: initialData?.slug ?? '',
        description: initialData?.description ?? '',
        brand: initialData?.brand ?? '',
        price: parseNumber(initialData?.price, 0),
        comparePrice: parseOptionalNumber(initialData?.comparePrice),
        costPrice: parseOptionalNumber(initialData?.costPrice),
        stockQty: parseNumber(initialData?.stockQty, 0),
        minStockQty: parseOptionalNumber(initialData?.minStockQty),
        categoryId: initialData?.categoryId,
        images: initialData?.images?.map(({ url, alt, isPrimary, order }) => ({
            url,
            alt,
            isPrimary,
            order: parseNumber(order, 0),
        })) ?? [],
        variants: initialData?.variants?.map(({ sku, name, price, comparePrice, stockQty, attributes, weight, images }) => ({
            sku,
            name,
            price: parseNumber(price, 0),
            comparePrice: parseOptionalNumber(comparePrice),
            stockQty: parseNumber(stockQty, 0),
            attributes: attributes ?? {},
            weight: parseOptionalNumber(weight),
            images: images ?? [],
        })) ?? [],
        attributes: initialData?.attributes?.map(({ name, value, displayOrder }) => ({
            name,
            value,
            displayOrder: parseNumber(displayOrder, 0),
        })) ?? [],
        weight: parseOptionalNumber(initialData?.weight),
        dimensions: initialData?.dimensions,
        compatibility: initialData?.compatibility ?? '',
        fitments: initialData?.fitments?.map(({ make, model, yearFrom, yearTo, engine, notes }) => ({ make, model, yearFrom, yearTo, engine, notes })) ?? [],
        isUniversal: initialData?.isUniversal ?? false,
        partNumbers: initialData?.partNumbers?.map(({ number, type, brand }) => ({ number, type, brand })) ?? [],
        tags: initialData?.tags ?? [],
        metaTitle: initialData?.metaTitle ?? '',
        metaDescription: initialData?.metaDescription ?? '',
        metaKeywords: initialData?.metaKeywords ?? [],
        isActive: initialData?.isActive ?? true,
    }));

    const update = <K extends keyof CreateProductPayload>(key: K, value: CreateProductPayload[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: '' }));
    };

    const handleNameChange = (value: string) => {
        update('name', value);
        if (!slugTouched) {
            update('slug', slugify(value));
        }
    };

    // ---- Images ----
    const addImageByFile = async (file: File) => {
        try {
            const result = await uploadImage.mutateAsync(file);
            const url = (result as any)?.url ?? (result as any)?.secure_url ?? '';
            if (!url) return;
            const nextImages: ImageDraft[] = [
                ...(form.images ?? []),
                { url, isPrimary: (form.images?.length ?? 0) === 0, order: form.images?.length ?? 0 },
            ];
            update('images', nextImages);
        } catch (err) {
            console.error('Image upload failed:', err);
        }
    };

    const removeImage = (index: number) => {
        const filtered = (form.images ?? []).filter((_, i) => i !== index);
        const hasPrimary = filtered.some((img) => img.isPrimary);
        const next = filtered.map((img, i) => ({
            ...img,
            order: i,
            isPrimary: hasPrimary ? img.isPrimary : i === 0,
        }));
        update('images', next);
    };

    const setPrimaryImage = (index: number) => {
        const next = (form.images ?? []).map((img, i) => ({ ...img, isPrimary: i === index }));
        update('images', next);
    };

    // ---- Tags ----
    const addTag = () => {
        const value = tagInput.trim();
        if (!value || form.tags?.includes(value)) {
            setTagInput('');
            return;
        }
        update('tags', [...(form.tags ?? []), value]);
        setTagInput('');
    };

    const removeTag = (tag: string) => {
        update('tags', (form.tags ?? []).filter((t) => t !== tag));
    };

    // ---- Meta Keywords ----
    const addMetaKeyword = () => {
        const value = metaKeywordInput.trim();
        if (!value || form.metaKeywords?.includes(value)) {
            setMetaKeywordInput('');
            return;
        }
        update('metaKeywords', [...(form.metaKeywords ?? []), value]);
        setMetaKeywordInput('');
    };

    const removeMetaKeyword = (keyword: string) => {
        update('metaKeywords', (form.metaKeywords ?? []).filter((k) => k !== keyword));
    };

    // ---- Attributes ----
    const addAttribute = () => {
        const next: AttributeDraft[] = [
            ...(form.attributes ?? []),
            { name: '', value: '', displayOrder: form.attributes?.length ?? 0 },
        ];
        update('attributes', next);
    };

    const updateAttribute = (index: number, field: keyof AttributeDraft, value: string | number) => {
        const next = [...(form.attributes ?? [])];
        next[index] = { ...next[index], [field]: value };
        update('attributes', next);
    };

    const removeAttribute = (index: number) => {
        update('attributes', (form.attributes ?? []).filter((_, i) => i !== index));
    };

    // ---- Variants ----
    const addVariant = () => {
        const next: VariantDraft[] = [
            ...(form.variants ?? []),
            { sku: '', name: '', price: 0, stockQty: 0, attributes: {}, images: [] },
        ];
        update('variants', next);
    };

    const updateVariant = (index: number, field: keyof VariantDraft, value: any) => {
        const next = [...(form.variants ?? [])];
        next[index] = { ...next[index], [field]: value };
        update('variants', next);
    };

    const removeVariant = (index: number) => {
        update('variants', (form.variants ?? []).filter((_, i) => i !== index));
    };

    const addVariantAttribute = (variantIndex: number) => {
        const next = [...(form.variants ?? [])];
        const attrs = { ...next[variantIndex].attributes, '': '' };
        next[variantIndex] = { ...next[variantIndex], attributes: attrs };
        update('variants', next);
    };

    const updateVariantAttribute = (variantIndex: number, oldKey: string, newKey: string, value: string) => {
        const next = [...(form.variants ?? [])];
        const attrs = { ...next[variantIndex].attributes };
        delete attrs[oldKey];
        attrs[newKey] = value;
        next[variantIndex] = { ...next[variantIndex], attributes: attrs };
        update('variants', next);
    };

    const removeVariantAttribute = (variantIndex: number, key: string) => {
        const next = [...(form.variants ?? [])];
        const attrs = { ...next[variantIndex].attributes };
        delete attrs[key];
        next[variantIndex] = { ...next[variantIndex], attributes: attrs };
        update('variants', next);
    };

    // ---- Validation & submit ----
    const validate = () => {
        const nextErrors: Record<string, string> = {};
        if (!form.sku || form.sku.trim().length < 3) nextErrors.sku = 'SKU must be at least 3 characters';
        if (!form.name || form.name.trim().length < 2) nextErrors.name = 'Name must be at least 2 characters';
        if (!form.slug || form.slug.trim().length < 2) nextErrors.slug = 'Slug must be at least 2 characters';
        const numPrice = parseNumber(form.price, -1);
        if (numPrice < 0) nextErrors.price = 'Price must be 0 or greater';
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const payload: CreateProductPayload = {
            ...form,
            price: parseNumber(form.price, 0),
            comparePrice: parseOptionalNumber(form.comparePrice),
            costPrice: parseOptionalNumber(form.costPrice),
            stockQty: parseOptionalNumber(form.stockQty),
            minStockQty: parseOptionalNumber(form.minStockQty),
            weight: parseOptionalNumber(form.weight),
            images: form.images?.map((img) => ({
                ...img,
                order: parseNumber(img.order, 0),
            })),
            variants: form.variants?.map((v) => ({
                ...v,
                price: parseNumber(v.price, 0),
                comparePrice: parseOptionalNumber(v.comparePrice),
                stockQty: parseOptionalNumber(v.stockQty),
                weight: parseOptionalNumber(v.weight),
            })),
            attributes: form.attributes?.map((attr) => ({
                ...attr,
                displayOrder: parseNumber(attr.displayOrder, 0),
            })),
            metaKeywords: form.metaKeywords ?? [],
            fitments: (form.fitments ?? [])
                .filter((f) => f.make.trim() && f.model.trim())
                .map((f) => ({
                    make: f.make.trim(),
                    model: f.model.trim(),
                    yearFrom: f.yearFrom ?? undefined,
                    yearTo: f.yearTo ?? undefined,
                    engine: f.engine?.trim() || undefined,
                    notes: f.notes?.trim() || undefined,
                })),
            partNumbers: (form.partNumbers ?? [])
                .filter((n) => n.number.trim())
                .map((n) => ({ number: n.number.trim(), type: n.type, brand: n.brand?.trim() || undefined })),
            // with structured rows the server writes the readable summary itself
            compatibility: (form.fitments ?? []).some((f) => f.make.trim() && f.model.trim()) ? undefined : form.compatibility,
        };

        onSubmit(payload);
    };

    const categoryOptions = categoriesData?.data ?? [];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.push('/products')}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back
                    </button>
                    <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {mode === 'create' ? 'Add Product' : `Edit ${initialData?.name ?? 'Product'}`}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => router.push('/products')}
                        className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create Product' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {serverError && (
                <div className="p-4 rounded-xl border border-red-100 bg-red-50 text-red-600 text-sm dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400">
                    {serverError}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic info */}
                    <Section title="Basic Information">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <Label required>Product Name</Label>
                                <input
                                    className={inputClass}
                                    value={form.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="e.g. Brake Pad Set — Toyota Axio"
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <Label required>SKU</Label>
                                <input
                                    className={inputClass}
                                    value={form.sku}
                                    onChange={(e) => update('sku', e.target.value)}
                                    placeholder="e.g. BRK-AXIO-001"
                                />
                                {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku}</p>}
                            </div>

                            <div>
                                <Label required>Slug</Label>
                                <input
                                    className={inputClass}
                                    value={form.slug}
                                    onChange={(e) => {
                                        setSlugTouched(true);
                                        update('slug', slugify(e.target.value));
                                    }}
                                    placeholder="brake-pad-set-toyota-axio"
                                />
                                {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <Label>Description</Label>
                                <textarea
                                    className={inputClass}
                                    rows={4}
                                    value={form.description}
                                    onChange={(e) => update('description', e.target.value)}
                                    placeholder="Details about fitment, materials, condition…"
                                />
                            </div>

                            <div>
                                <Label>Brand</Label>
                                <input
                                    className={inputClass}
                                    value={form.brand}
                                    onChange={(e) => update('brand', e.target.value)}
                                    placeholder="e.g. Bosch"
                                />
                            </div>

                            <div>
                                <Label>Category</Label>
                                <select
                                    className={inputClass}
                                    value={form.categoryId ?? ''}
                                    onChange={(e) => update('categoryId', e.target.value || undefined)}
                                >
                                    <option value="">No category</option>
                                    {categoryOptions.map((cat: any) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>


                            <div>
                                <Label>Weight (kg)</Label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className={inputClass}
                                    value={form.weight ?? ''}
                                    onChange={(e) => update('weight', e.target.value ? Number(e.target.value) : undefined)}
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Pricing & inventory */}
                    <Section title="Pricing & Inventory">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <Label required>Price (KES)</Label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className={inputClass}
                                    value={form.price}
                                    onChange={(e) => update('price', Number(e.target.value))}
                                />
                                {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                            </div>
                            <div>
                                <Label>Compare-at Price</Label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className={inputClass}
                                    value={form.comparePrice ?? ''}
                                    onChange={(e) => update('comparePrice', e.target.value ? Number(e.target.value) : undefined)}
                                />
                            </div>
                            <div>
                                <Label>Cost Price</Label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className={inputClass}
                                    value={form.costPrice ?? ''}
                                    onChange={(e) => update('costPrice', e.target.value ? Number(e.target.value) : undefined)}
                                />
                            </div>
                            <div>
                                <Label>Stock Quantity</Label>
                                <input
                                    type="number"
                                    className={inputClass}
                                    value={form.stockQty}
                                    onChange={(e) => update('stockQty', Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <Label>Low Stock Threshold</Label>
                                <input
                                    type="number"
                                    className={inputClass}
                                    value={form.minStockQty ?? ''}
                                    onChange={(e) => update('minStockQty', e.target.value ? Number(e.target.value) : undefined)}
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Images */}
                    <Section title="Images" description="First image, or the one marked primary, is used as the thumbnail.">
                        <div className="flex flex-wrap gap-3 mb-4">
                            {(form.images ?? []).map((img, index) => (
                                <div key={`${img.url}-${index}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group">
                                    <Image src={img.url} alt={img.alt ?? ''} fill className="object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <XMarkIcon className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPrimaryImage(index)}
                                        className={`absolute bottom-0 inset-x-0 text-[10px] py-0.5 text-center font-medium ${img.isPrimary ? 'bg-blue-600 text-white' : 'bg-black/40 text-white opacity-0 group-hover:opacity-100'
                                            }`}
                                    >
                                        {img.isPrimary ? 'Primary' : 'Set primary'}
                                    </button>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadImage.isPending}
                                className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
                            >
                                <PlusIcon className="w-5 h-5" />
                                <span className="text-xs mt-1">{uploadImage.isPending ? 'Uploading…' : 'Add'}</span>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={async (e) => {
                                    const files = Array.from(e.target.files ?? []);
                                    for (const file of files) {
                                        await addImageByFile(file);
                                    }
                                    e.target.value = '';
                                }}
                            />
                        </div>
                    </Section>

                    {/* Variants */}
                    <Section title="Variants" description="Optional — use for size/color combinations with their own SKU, price, and stock.">
                        <div className="space-y-4">
                            {(form.variants ?? []).map((variant, vIndex) => (
                                <div key={vIndex} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-500">Variant {vIndex + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeVariant(vIndex)}
                                            className="text-red-500 hover:text-red-600"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                        <input
                                            className={inputClass}
                                            placeholder="SKU"
                                            value={variant.sku}
                                            onChange={(e) => updateVariant(vIndex, 'sku', e.target.value)}
                                        />
                                        <input
                                            className={inputClass}
                                            placeholder="Name (e.g. Red / L)"
                                            value={variant.name}
                                            onChange={(e) => updateVariant(vIndex, 'name', e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            step="0.01"
                                            className={inputClass}
                                            placeholder="Price"
                                            value={variant.price ?? ''}
                                            onChange={(e) => updateVariant(vIndex, 'price', e.target.value ? Number(e.target.value) : 0)}
                                        />
                                        <input
                                            type="number"
                                            step="0.01"
                                            className={inputClass}
                                            placeholder="Compare Price"
                                            value={variant.comparePrice ?? ''}
                                            onChange={(e) => updateVariant(vIndex, 'comparePrice', e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                        <input
                                            type="number"
                                            className={inputClass}
                                            placeholder="Stock"
                                            value={variant.stockQty ?? ''}
                                            onChange={(e) => updateVariant(vIndex, 'stockQty', e.target.value ? Number(e.target.value) : 0)}
                                        />
                                        <input
                                            type="number"
                                            step="0.01"
                                            className={inputClass}
                                            placeholder="Weight (kg)"
                                            value={variant.weight ?? ''}
                                            onChange={(e) => updateVariant(vIndex, 'weight', e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                    </div>

                                    <div>
                                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Attributes</span>
                                        <div className="space-y-2 mt-2">
                                            {Object.entries(variant.attributes ?? {}).map(([key, value], aIndex) => (
                                                <div key={aIndex} className="flex items-center gap-2">
                                                    <input
                                                        className={inputClass}
                                                        placeholder="Name (e.g. Color)"
                                                        value={key}
                                                        onChange={(e) => updateVariantAttribute(vIndex, key, e.target.value, value)}
                                                    />
                                                    <input
                                                        className={inputClass}
                                                        placeholder="Value (e.g. Red)"
                                                        value={value}
                                                        onChange={(e) => updateVariantAttribute(vIndex, key, key, e.target.value)}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeVariantAttribute(vIndex, key)}
                                                        className="text-gray-400 hover:text-red-500 shrink-0"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => addVariantAttribute(vIndex)}
                                                className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                            >
                                                + Add attribute
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addVariant}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add variant
                            </button>
                        </div>
                    </Section>

                    {/* Attributes */}
                    <Section title="Attributes" description="Spec-sheet style details shown on the product page (e.g. Material: Ceramic).">
                        <div className="space-y-2">
                            {(form.attributes ?? []).map((attr, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        className={inputClass}
                                        placeholder="Name"
                                        value={attr.name}
                                        onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                                    />
                                    <input
                                        className={inputClass}
                                        placeholder="Value"
                                        value={attr.value}
                                        onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeAttribute(index)}
                                        className="text-gray-400 hover:text-red-500 shrink-0"
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addAttribute}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add attribute
                            </button>
                        </div>
                    </Section>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Section title="Vehicle fitment" description="Which vehicles this part fits. Powers the storefront's Make → Model → Year finder and the 'Fits your vehicle' check.">
                        <FitmentEditor
                            fitments={(form.fitments ?? []) as ProductFitment[]}
                            isUniversal={!!form.isUniversal}
                            onChange={(rows) => update('fitments', rows as CreateProductPayload['fitments'])}
                            onUniversalChange={(v) => update('isUniversal', v)}
                        />
                        {!(form.fitments ?? []).length && form.compatibility && (
                            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                Current text fitment: <span className="font-medium text-gray-700 dark:text-gray-200">{form.compatibility}</span> — use &ldquo;Import from text&rdquo; to turn it into rows.
                            </p>
                        )}
                    </Section>

                    <Section title="Part numbers & cross-references" description="OE numbers from the vehicle maker and equivalent aftermarket numbers. Mechanics search by these — all are searchable on the storefront.">
                        <PartNumbersEditor
                            rows={(form.partNumbers ?? []) as ProductPartNumber[]}
                            onChange={(rows) => update('partNumbers', rows as CreateProductPayload['partNumbers'])}
                        />
                    </Section>

                    <Section title="Status">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(e) => update('isActive', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-200">
                                {form.isActive ? 'Active — visible to customers' : 'Inactive — hidden from storefront'}
                            </span>
                        </label>
                    </Section>

                    <Section title="Tags">
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {(form.tags ?? []).map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                                >
                                    {tag}
                                    <button type="button" onClick={() => removeTag(tag)}>
                                        <XMarkIcon className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                className={inputClass}
                                placeholder="Add a tag and press Enter"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addTag();
                                    }
                                }}
                            />
                        </div>
                    </Section>

                    <Section title="SEO">
                        <div className="space-y-3">
                            <div>
                                <Label>Meta Title</Label>
                                <input
                                    className={inputClass}
                                    value={form.metaTitle}
                                    onChange={(e) => update('metaTitle', e.target.value)}
                                    maxLength={60}
                                />
                            </div>
                            <div>
                                <Label>Meta Description</Label>
                                <textarea
                                    className={inputClass}
                                    rows={3}
                                    value={form.metaDescription}
                                    onChange={(e) => update('metaDescription', e.target.value)}
                                    maxLength={160}
                                />
                            </div>
                            <div>
                                <Label>Meta Keywords</Label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {(form.metaKeywords ?? []).map((keyword) => (
                                        <span
                                            key={keyword}
                                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                                        >
                                            {keyword}
                                            <button type="button" onClick={() => removeMetaKeyword(keyword)}>
                                                <XMarkIcon className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        className={inputClass}
                                        placeholder="Add a keyword and press Enter"
                                        value={metaKeywordInput}
                                        onChange={(e) => setMetaKeywordInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addMetaKeyword();
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </Section>
                </div>
            </div>
        </form>
    );
}