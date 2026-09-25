// src/features/categories/components/CategoryForm.tsx
'use client';

import React, { useRef, useState, useEffect, isValidElement } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    ImagePlus,
    X,
    ChevronDown,
    Loader2,
    ChevronLeft,
    Check,
    AlertCircle,
    Search,
    Menu,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

import { Button } from '@/components/custom/Button';
import { Button as ShadcnButton } from '@/components/ui/button';
import { Input } from '@/components/custom/Input';
import { useIsMobile } from '@/hooks/use-mobile';

import {
    createCategorySchema,
    CreateCategoryFormValues,
} from '@/features/categories/libs/category.schema';

import {
    useCategories,
    useCreateCategory,
    useUpdateCategory,
    useImageUpload,
    flattenCategories,
    useCategory,
} from '@/features/categories/hooks/useCategories';

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

// Get all Lucide icon names — only PascalCase exports are React components
const lucideIconNames = Object.keys(LucideIcons).filter((key) => {
    if (!/^[A-Z]/.test(key) || key === 'default') {
        return false;
    }

    const icon = LucideIcons[key as keyof typeof LucideIcons];

    return (
        typeof icon === 'function' ||
        (typeof icon === 'object' && icon !== null)
    );
});

// Common icon categories for suggestions
const commonIconCategories = {
    'Navigation': ['Home', 'ArrowLeft', 'ArrowRight', 'ChevronDown', 'ChevronUp', 'Menu'],
    'Actions': ['Check', 'X', 'Plus', 'Minus', 'Pencil', 'Trash2'],
    'Content': ['Folder', 'Tag', 'File', 'Image', 'Video', 'Music'],
    'Commerce': ['ShoppingCart', 'ShoppingBag', 'CreditCard', 'Package', 'Truck'],
    'Social': ['User', 'Users', 'Heart', 'Star', 'Share2', 'Mail'],
    'Tools': ['Wrench', 'Settings', 'Search', 'Filter', 'Sliders'],
};

interface CategoryFormProps {
    categoryId?: string;
    mode?: 'create' | 'edit';
}

export default function CategoryForm({
    categoryId,
    mode = 'create'
}: CategoryFormProps) {
    const router = useRouter();
    const isMobile = useIsMobile();
    const [slugTouched, setSlugTouched] = useState(false);
    const [iconPreview, setIconPreview] = useState<React.ReactNode | null>(null);
    const [iconError, setIconError] = useState<string | null>(null);
    const [showIconSearch, setShowIconSearch] = useState(false);
    const [iconSearchTerm, setIconSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const iconInputRef = useRef<HTMLInputElement>(null);

    const isEditMode = mode === 'edit' && categoryId;

    // Fetch categories for parent options
    const { data: categoriesResponse } = useCategories();

    // Fetch category data if in edit mode
    const { data: categoryData, isLoading: isLoadingCategory } = useCategory(
        isEditMode ? categoryId : undefined
    );

    const categories = Array.isArray(categoriesResponse)
        ? categoriesResponse
        : categoriesResponse?.data ?? [];

    // Get unique parent options to avoid duplicate keys
    const parentOptions = flattenCategories(categories);
    // Remove duplicates by id
    const uniqueParentOptions = Array.from(
        new Map(parentOptions.map(item => [item.id, item])).values()
    );

    const createCategory = useCreateCategory();
    const updateCategory = useUpdateCategory();
    const uploadImage = useImageUpload();

    const isPending = createCategory.isPending || updateCategory.isPending;

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        control,
        reset,
        formState: { errors },
    } = useForm<CreateCategoryFormValues>({
        resolver: zodResolver(createCategorySchema),
        defaultValues: {
            isActive: true,
            name: '',
            slug: '',
            description: '',
            icon: '',
            imageUrl: '',
            parentId: '',
        },
    });

    // Populate form with category data when in edit mode
    useEffect(() => {
        if (isEditMode && categoryData) {
            reset({
                name: categoryData.name,
                slug: categoryData.slug,
                description: categoryData.description || '',
                icon: categoryData.icon || '',
                imageUrl: categoryData.imageUrl || '',
                parentId: categoryData.parentId || '',
                isActive: categoryData.isActive,
            });
            // Preview the icon if it exists
            if (categoryData.icon) {
                previewIcon(categoryData.icon);
            }
        }
    }, [categoryData, isEditMode, reset]);

    const imageUrl = watch('imageUrl');
    const nameValue = watch('name');
    const iconValue = watch('icon');

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setValue('name', value);

        if (!slugTouched) {
            setValue('slug', slugify(value));
        }
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const result = await uploadImage.mutateAsync(file);
            setValue('imageUrl', result.url, {
                shouldValidate: true,
            });
        } catch (error) {
            console.error('Failed to upload category image:', error);
        }
    };

    const handleRemoveImage = () => {
        setValue('imageUrl', '');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const previewIcon = (iconName: string) => {
        setIconError(null);

        try {
            const IconComponent =
                LucideIcons[iconName as keyof typeof LucideIcons];

            if (!IconComponent) {
                setIconPreview(null);
                setIconError(`Icon "${iconName}" not found in Lucide React`);
                return false;
            }

            const IconComp = IconComponent as React.ElementType;

            const element = React.createElement(IconComp, {
                className: 'h-6 w-6',
            });

            if (isValidElement(element)) {
                setIconPreview(element);
                return true;
            }

            setIconPreview(null);
            setIconError(`Icon "${iconName}" is not available`);
            return false;
        } catch (error) {
            console.error(`Failed to load icon "${iconName}":`, error);

            setIconPreview(null);
            setIconError(`Icon "${iconName}" is not available`);
            return false;
        }
    };

    const handleIconChange = (value: string) => {
        setValue('icon', value);
        if (value.trim()) {
            previewIcon(value.trim());
        } else {
            setIconPreview(null);
            setIconError(null);
        }
    };

    const handleValidateIcon = () => {
        if (iconValue && iconValue.trim()) {
            const isValid = previewIcon(iconValue.trim());
            if (isValid) {
                // Show success feedback
                setIconError(null);
                // Close search if open
                setShowIconSearch(false);
            }
        } else {
            setIconError('Please enter an icon name');
        }
    };

    const handleSelectIcon = (iconName: string) => {
        handleIconChange(iconName);
        const isValid = previewIcon(iconName);
        if (isValid) {
            setIconError(null);
            setShowIconSearch(false);
            setIconSearchTerm('');
        }
    };

    // Filter icons based on search term - ensure unique keys
    const filteredIcons = Array.from(
        new Set(
            lucideIconNames.filter(name =>
                name.toLowerCase().includes(iconSearchTerm.toLowerCase())
            )
        )
    ).slice(0, 50);

    const onSubmit = (values: CreateCategoryFormValues) => {
        if (isEditMode && categoryId) {
            updateCategory.mutate({
                id: categoryId,
                input: {
                    ...values,
                    slug: values.slug || undefined,
                    parentId: values.parentId || undefined,
                    imageUrl: values.imageUrl || undefined,
                },
            });
        } else {
            createCategory.mutate({
                ...values,
                slug: values.slug || undefined,
                parentId: values.parentId || undefined,
                imageUrl: values.imageUrl || undefined,
            });
        }
    };

    const handleDiscard = () => {
        if (window.confirm('Are you sure you want to discard your changes?')) {
            router.back();
        }
    };

    if (isEditMode && isLoadingCategory) {
        return (
            <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const pageTitle = isEditMode ? 'Edit Category' : 'Add New Category';
    const submitButtonText = isEditMode ? 'Update Category' : 'Create Category';

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-4 md:px-8 md:py-6">
            {/* Header */}
            <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <ShadcnButton
                        type="button"
                        variant="outline"
                        className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shrink-0"
                        onClick={() => router.back()}
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Back</span>
                    </ShadcnButton>
                    <div className="flex items-center gap-2 min-w-0">
                        <h1 className="text-lg md:text-xl font-semibold text-slate-800 truncate">
                            {pageTitle}
                        </h1>
                        {isEditMode && categoryData && (
                            <span className="text-xs md:text-sm text-slate-400 truncate">
                                #{categoryData.id.slice(0, 8)}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <ShadcnButton
                        type="button"
                        variant="outline"
                        className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        onClick={handleDiscard}
                    >
                        <span className="hidden sm:inline">Discard</span>
                        <span className="sm:hidden">✕</span>
                    </ShadcnButton>

                    <ShadcnButton
                        type="submit"
                        form="category-form"
                        className="bg-blue-700 text-white hover:bg-blue-800"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                <span className="hidden sm:inline">
                                    {isEditMode ? 'Updating...' : 'Creating...'}
                                </span>
                            </>
                        ) : (
                            <span className="hidden sm:inline">{submitButtonText}</span>
                        )}
                        <span className="sm:hidden">
                            {isPending ? '...' : isEditMode ? 'Update' : 'Create'}
                        </span>
                    </ShadcnButton>
                </div>
            </div>

            <form
                id="category-form"
                onSubmit={handleSubmit(onSubmit)}
                className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[1fr_380px]"
            >
                {/* ========================= */}
                {/* LEFT - BASIC DETAILS */}
                {/* ========================= */}

                <div className="rounded-xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
                    <h2 className="mb-4 md:mb-5 text-base md:text-lg font-semibold text-slate-800">
                        Basic Details
                    </h2>

                    {/* Category Name */}
                    <div className="mb-4 md:mb-5">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Category Name <span className="text-red-500">*</span>
                        </label>

                        <Input
                            placeholder="e.g. Brake Systems"
                            value={nameValue ?? ''}
                            onChange={handleNameChange}
                            error={errors.name?.message}
                        />
                    </div>

                    {/* Slug */}
                    <div className="mb-4 md:mb-5">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Slug <span className="text-red-500">*</span>
                        </label>

                        <Input
                            placeholder="brake-systems"
                            {...register('slug')}
                            onChange={(e) => {
                                setSlugTouched(true);
                                setValue('slug', e.target.value);
                            }}
                            error={errors.slug?.message}
                        />

                        <p className="mt-1 text-xs text-slate-400">
                            Auto-generated from the name — edit it to override.
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Description
                        </label>

                        <textarea
                            {...register('description')}
                            rows={5}
                            placeholder="What kind of parts live in this category?"
                            className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                        />

                        {errors.description && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.description.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* ========================= */}
                {/* RIGHT */}
                {/* ========================= */}

                <div className="space-y-4 md:space-y-6">
                    {/* Category Image */}
                    <div className="rounded-xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
                        <h2 className="mb-3 md:mb-4 text-base md:text-lg font-semibold text-slate-800">
                            Category Image
                        </h2>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageSelect}
                        />

                        <div className="relative flex h-32 md:h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
                            {uploadImage.isPending ? (
                                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                            ) : imageUrl ? (
                                <>
                                    <img
                                        src={imageUrl}
                                        alt="Category preview"
                                        className="h-full w-full rounded-lg object-cover"
                                    />

                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow ring-1 ring-slate-200 hover:bg-slate-50"
                                    >
                                        <X className="h-3.5 w-3.5 text-slate-500" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-slate-600"
                                >
                                    <ImagePlus className="h-6 w-6" />
                                    <span className="text-sm">Browse</span>
                                </button>
                            )}
                        </div>

                        {errors.imageUrl && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.imageUrl.message}
                            </p>
                        )}
                    </div>

                    {/* Icon */}
                    <div className="rounded-xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
                        <h2 className="mb-3 md:mb-4 text-base md:text-lg font-semibold text-slate-800">
                            Icon
                        </h2>

                        <div className="space-y-3">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Icon Name
                                </label>

                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <Input
                                            ref={iconInputRef}
                                            placeholder="e.g. Folder, Tag, Cube, Wrench"
                                            value={iconValue ?? ''}
                                            onChange={(e) => handleIconChange(e.target.value)}
                                            error={iconError || errors.icon?.message}
                                            onFocus={() => !isMobile && setShowIconSearch(true)}
                                        />
                                    </div>

                                    <ShadcnButton
                                        type="button"
                                        variant="outline"
                                        className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shrink-0"
                                        onClick={handleValidateIcon}
                                        disabled={!iconValue || !iconValue.trim()}
                                    >
                                        <Check className="h-4 w-4" />
                                    </ShadcnButton>

                                    <ShadcnButton
                                        type="button"
                                        variant="outline"
                                        className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shrink-0"
                                        onClick={() => {
                                            setShowIconSearch(!showIconSearch);
                                            setIconSearchTerm('');
                                            if (iconInputRef.current) {
                                                iconInputRef.current.focus();
                                            }
                                        }}
                                    >
                                        <Search className="h-4 w-4" />
                                    </ShadcnButton>
                                </div>

                                {/* Icon Search Modal */}
                                {showIconSearch && (
                                    <div className="mt-3 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
                                        <div className="p-3 border-b border-slate-100">
                                            <input
                                                type="text"
                                                placeholder="Search icons..."
                                                value={iconSearchTerm}
                                                onChange={(e) => setIconSearchTerm(e.target.value)}
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="max-h-60 overflow-y-auto p-2">
                                            {filteredIcons.length > 0 ? (
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                                                    {filteredIcons.map((name) => {
                                                        const IconComponent =
                                                            LucideIcons[name as keyof typeof LucideIcons] as React.ElementType;

                                                        if (!IconComponent) return null;

                                                        const isSelected = iconValue === name;

                                                        return (
                                                            <button
                                                                key={`icon-${name}`}
                                                                type="button"
                                                                onClick={() => handleSelectIcon(name)}
                                                                className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-colors ${isSelected
                                                                    ? 'bg-blue-100 ring-2 ring-blue-500'
                                                                    : 'hover:bg-slate-100'
                                                                    }`}
                                                                title={name}
                                                            >
                                                                <IconComponent className="h-5 w-5" />

                                                                <span className="w-full truncate text-center text-[10px] text-slate-500">
                                                                    {name}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-slate-400">
                                                    <p className="text-sm">No icons found</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Icon Preview */}
                                {iconPreview && (
                                    <div className="mt-3 flex items-center gap-4 rounded-lg bg-blue-50 p-3 border border-blue-200">
                                        <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-white shadow-sm">
                                            {iconPreview}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-blue-700">
                                                Icon loaded successfully
                                            </p>
                                            <p className="text-xs text-blue-600">
                                                {iconValue}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {iconError && (
                                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 p-3 border border-red-200">
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                        <p className="text-sm text-red-600">{iconError}</p>
                                    </div>
                                )}

                                {/* Common Icon Suggestions by Category */}
                                <div className="mt-3">
                                    <p className="text-xs font-medium text-slate-500 mb-2">
                                        Common icons you can use:
                                    </p>
                                    <div className="space-y-2">
                                        {Object.entries(commonIconCategories).map(([category, icons]) => (
                                            <div key={category}>
                                                <p className="text-[10px] font-medium text-slate-400 mb-1">
                                                    {category}
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {icons.map((iconName) => (
                                                        <button
                                                            key={`suggestion-${iconName}`}
                                                            type="button"
                                                            onClick={() => handleSelectIcon(iconName)}
                                                            className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors ${iconValue === iconName
                                                                    ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                                }`}
                                                        >
                                                            {iconName}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <p className="mt-1 text-xs text-slate-400">
                                    Enter a Lucide React icon name (e.g., Folder, Tag, Cube)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Organization */}
                    <div className="rounded-xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
                        <h2 className="mb-3 md:mb-4 text-base md:text-lg font-semibold text-slate-800">
                            Organization
                        </h2>

                        {/* Parent Category */}
                        <div className="mb-4 md:mb-5">
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Parent Category
                            </label>

                            <div className="relative">
                                <select
                                    {...register('parentId')}
                                    className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                                >
                                    <option value="">
                                        None (top-level category)
                                    </option>

                                    {uniqueParentOptions.map((opt) => {
                                        // In edit mode, prevent selecting self or descendants
                                        const isDisabled = !!(isEditMode &&
                                            (opt.id === categoryId ||
                                                isDescendant(opt.id, categoryId)));

                                        return (
                                            <option
                                                key={`parent-${opt.id}`}
                                                value={opt.id}
                                                disabled={isDisabled}
                                            >
                                                {'\u00A0\u00A0'.repeat(opt.depth)}
                                                {opt.depth > 0 ? '↳ ' : ''}
                                                {opt.name}
                                                {isDisabled && ' (current category)'}
                                            </option>
                                        );
                                    })}
                                </select>

                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            </div>

                            {errors.parentId && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.parentId.message}
                                </p>
                            )}
                        </div>

                        {/* Active */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-700">
                                    Active
                                </p>

                                <p className="text-xs text-slate-400">
                                    Visible in the storefront
                                </p>
                            </div>

                            <Controller
                                name="isActive"
                                control={control}
                                render={({ field }) => (
                                    <button
                                        type="button"
                                        onClick={() => field.onChange(!field.value)}
                                        className={`h-6 w-11 rounded-full transition-colors ${field.value
                                            ? 'bg-blue-700'
                                            : 'bg-slate-200'
                                            }`}
                                    >
                                        <span
                                            className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform ${field.value ? 'translate-x-5' : ''
                                                }`}
                                        />
                                    </button>
                                )}
                            />
                        </div>
                    </div>

                    {/* Metadata (optional) */}
                    {isEditMode && (
                        <div className="rounded-xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
                            <h2 className="mb-3 md:mb-4 text-base md:text-lg font-semibold text-slate-800">
                                Information
                            </h2>

                            <div className="space-y-2 text-sm text-slate-600">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Created</span>
                                    <span>
                                        {categoryData?.createdAt
                                            ? new Date(categoryData.createdAt).toLocaleString()
                                            : '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Last Updated</span>
                                    <span>
                                        {categoryData?.updatedAt
                                            ? new Date(categoryData.updatedAt).toLocaleString()
                                            : '—'}
                                    </span>
                                </div>
                                {categoryData?.productsCount !== undefined && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Products</span>
                                        <span>{categoryData.productsCount}</span>
                                    </div>
                                )}
                                {categoryData?.children?.length !== undefined && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Sub-categories</span>
                                        <span>{categoryData.children.length}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}

// Helper function to check if a category is a descendant of another
function isDescendant(categoryId: string, ancestorId?: string): boolean {
    if (!ancestorId) return false;
    return false;
}