// src/features/categories/components/ViewCategory.tsx
'use client';

import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Pencil,
    Trash2,
    Link2,
    Calendar,
    Package,
    FolderTree,
    CheckCircle,
    XCircle,
    ImageIcon,
    Hash,
} from 'lucide-react';
import { Button as ShadcnButton } from '@/components/ui/button';
import { useCategory, useDeleteCategory } from '@/features/categories/hooks/useCategories';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { useIsMobile } from '@/hooks/use-mobile';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Category } from '@/types/category.types';

interface ViewCategoryProps {
    categoryId: string;
}

// Helper to get Lucide icon component
function getCategoryIcon(iconName?: string | null): LucideIcon | null {
    if (!iconName) return null;

    const directIcon = LucideIcons[iconName as keyof typeof LucideIcons];
    if (typeof directIcon === 'function' || (typeof directIcon === 'object' && directIcon !== null)) {
        return directIcon as unknown as LucideIcon;
    }

    const normalizedName = iconName
        .split(/[-_\s]+/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

    const normalizedIcon = LucideIcons[normalizedName as keyof typeof LucideIcons];
    if (typeof normalizedIcon === 'function' || (typeof normalizedIcon === 'object' && normalizedIcon !== null)) {
        return normalizedIcon as unknown as LucideIcon;
    }

    return null;
}

export default function ViewCategory({ categoryId }: ViewCategoryProps) {
    const router = useRouter();
    const isMobile = useIsMobile();
    const { data: category, isLoading, isError, error } = useCategory(categoryId);
    const deleteCategory = useDeleteCategory();

    const handleEdit = () => {
        router.push(`/categories/${categoryId}/edit`);
    };

    const handleDelete = () => {
        if (category) {
            deleteCategory.mutate(category.id, {
                onSuccess: () => {
                    router.push('/categories');
                }
            });
        }
    };

    const handleBack = () => {
        router.back();
    };

    const handleCopySlug = () => {
        if (category) {
            navigator.clipboard.writeText(category.slug);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    <p className="text-sm text-slate-500">Loading category...</p>
                </div>
            </div>
        );
    }

    if (isError || !category) {
        return (
            <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 md:p-6 text-red-700">
                    <h3 className="text-base md:text-lg font-semibold">Error Loading Category</h3>
                    <p className="mt-2 text-sm">
                        {error instanceof Error ? error.message : 'Category not found or failed to load.'}
                    </p>
                    <button
                        onClick={handleBack}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-red-700 hover:text-red-900"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Get icon component if exists
    const IconComponent = getCategoryIcon(category.icon);

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-4 md:px-8 md:py-6">
            {/* Header */}
            <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <ShadcnButton
                        type="button"
                        variant="outline"
                        className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shrink-0"
                        onClick={handleBack}
                    >
                        <ChevronLeft className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Back</span>
                    </ShadcnButton>
                    <div className="flex items-center gap-2 min-w-0">
                        <h1 className="text-base md:text-xl font-semibold text-slate-800 truncate">
                            Category Details
                        </h1>
                        <span className="text-xs md:text-sm text-slate-400 truncate">
                            #{category.id.slice(0, 8)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <ShadcnButton
                        type="button"
                        variant="outline"
                        className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        onClick={handleEdit}
                    >
                        <Pencil className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Edit</span>
                    </ShadcnButton>

                    <ShadcnButton
                        type="button"
                        variant="destructive"
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={handleDelete}
                    >
                        <Trash2 className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Delete</span>
                    </ShadcnButton>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[1fr_380px]">
                {/* ========================= */}
                {/* LEFT - MAIN DETAILS */}
                {/* ========================= */}
                <div className="space-y-4 md:space-y-6">
                    {/* Basic Information */}
                    <div className="rounded-xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
                        <h2 className="mb-4 md:mb-5 text-base md:text-lg font-semibold text-slate-800">
                            Basic Information
                        </h2>

                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="text-sm font-medium text-slate-500">
                                    Category Name
                                </label>
                                <p className="mt-1 text-base text-slate-800 break-words">
                                    {category.name}
                                </p>
                            </div>

                            {/* Slug */}
                            <div>
                                <label className="text-sm font-medium text-slate-500">
                                    Slug
                                </label>
                                <div className="mt-1 flex items-center gap-2 flex-wrap">
                                    <p className="text-base text-slate-800 break-all">
                                        /{category.slug}
                                    </p>
                                    <button
                                        onClick={handleCopySlug}
                                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
                                        title="Copy slug"
                                    >
                                        <Link2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Description */}
                            {category.description && (
                                <div>
                                    <label className="text-sm font-medium text-slate-500">
                                        Description
                                    </label>
                                    <p className="mt-1 text-base text-slate-800 whitespace-pre-wrap break-words">
                                        {category.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Hierarchy */}
                    <div className="rounded-xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
                        <h2 className="mb-4 md:mb-5 text-base md:text-lg font-semibold text-slate-800">
                            Hierarchy
                        </h2>

                        <div className="space-y-4">
                            {/* Parent */}
                            <div>
                                <label className="text-sm font-medium text-slate-500">
                                    Parent Category
                                </label>
                                <p className="mt-1 text-base text-slate-800">
                                    {category.parent ? (
                                        <button
                                            onClick={() => router.push(`/categories/${category.parent?.id}`)}
                                            className="text-blue-600 hover:text-blue-700 hover:underline text-left"
                                        >
                                            {category.parent.name}
                                        </button>
                                    ) : (
                                        <span className="text-slate-400">None (Top-level)</span>
                                    )}
                                </p>
                            </div>

                            {/* Children */}
                            {category.children && category.children.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium text-slate-500">
                                        Sub-Categories ({category.children.length})
                                    </label>
                                    <div className="mt-2 flex flex-wrap gap-1.5 md:gap-2">
                                        {category.children.map((child: Category) => (
                                            <button
                                                key={child.id}
                                                onClick={() => router.push(`/categories/${child.id}`)}
                                                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm text-slate-700 hover:bg-slate-200 transition-colors"
                                            >
                                                <FolderTree className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                                <span className="truncate max-w-[80px] md:max-w-none">
                                                    {child.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ========================= */}
                {/* RIGHT - SIDEBAR */}
                {/* ========================= */}
                <div className="space-y-4 md:space-y-6">
                    {/* Status & Media */}
                    <div className="rounded-xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
                        <h2 className="mb-3 md:mb-4 text-base md:text-lg font-semibold text-slate-800">
                            Status & Media
                        </h2>

                        {/* Image */}
                        <div className="mb-4">
                            <label className="text-sm font-medium text-slate-500">
                                Image
                            </label>
                            <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
                                {category.imageUrl ? (
                                    <img
                                        src={category.imageUrl}
                                        alt={category.name}
                                        className="h-40 md:h-48 w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-32 md:h-48 flex-col items-center justify-center bg-slate-50 text-slate-400">
                                        <ImageIcon className="h-8 w-8 md:h-12 md:w-12" />
                                        <p className="mt-1 md:mt-2 text-xs md:text-sm">No image</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Icon */}
                        {category.icon && (
                            <div className="mb-4">
                                <label className="text-sm font-medium text-slate-500">
                                    Icon
                                </label>
                                <div className="mt-1 flex items-center gap-3">
                                    {IconComponent ? (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                                            <IconComponent className="h-5 w-5" />
                                        </div>
                                    ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 shrink-0">
                                            <span className="text-sm font-medium">
                                                {category.icon.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-sm text-slate-800 break-all">
                                        {category.icon}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Status */}
                        <div>
                            <label className="text-sm font-medium text-slate-500">
                                Status
                            </label>
                            <div className="mt-1 flex items-center gap-2">
                                {category.isActive ? (
                                    <>
                                        <CheckCircle className="h-5 w-5 text-blue-600 shrink-0" />
                                        <span className="text-base font-medium text-blue-600">
                                            Active
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-5 w-5 text-slate-400 shrink-0" />
                                        <span className="text-base font-medium text-slate-400">
                                            Inactive
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="rounded-xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
                        <h2 className="mb-3 md:mb-4 text-base md:text-lg font-semibold text-slate-800">
                            Statistics
                        </h2>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Package className="h-4 w-4 shrink-0" />
                                    <span className="text-xs md:text-sm">Products</span>
                                </div>
                                <span className="font-medium text-slate-800">
                                    {category.productsCount || 0}
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <FolderTree className="h-4 w-4 shrink-0" />
                                    <span className="text-xs md:text-sm">Sub-Categories</span>
                                </div>
                                <span className="font-medium text-slate-800">
                                    {category.children?.length || 0}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Hash className="h-4 w-4 shrink-0" />
                                    <span className="text-xs md:text-sm">ID</span>
                                </div>
                                <span className="font-mono text-xs md:text-sm text-slate-600 truncate max-w-[120px] md:max-w-[160px]">
                                    {category.id}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Timestamps */}
                    <div className="rounded-xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
                        <h2 className="mb-3 md:mb-4 text-base md:text-lg font-semibold text-slate-800">
                            Timestamps
                        </h2>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-slate-500 shrink-0">
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-xs md:text-sm">Created</span>
                                </div>
                                <span className="text-xs md:text-sm text-slate-800 text-right truncate">
                                    {new Date(category.createdAt).toLocaleString()}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-slate-500 shrink-0">
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-xs md:text-sm">Last Updated</span>
                                </div>
                                <span className="text-xs md:text-sm text-slate-800 text-right truncate">
                                    {new Date(category.updatedAt).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="rounded-xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
                        <h2 className="mb-3 md:mb-4 text-base md:text-lg font-semibold text-slate-800">
                            Actions
                        </h2>

                        <div className="space-y-2">
                            <ShadcnButton
                                type="button"
                                variant="outline"
                                className="w-full justify-center border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                                onClick={handleEdit}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Category
                            </ShadcnButton>

                            <ShadcnButton
                                type="button"
                                variant="destructive"
                                className="w-full justify-center bg-red-600 text-white hover:bg-red-700"
                                onClick={handleDelete}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Category
                            </ShadcnButton>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteCategory.isPending}
                onClose={() => { }} // This will be handled by the mutation
                onConfirm={handleDelete}
                isDeleting={deleteCategory.isPending}
                title="Delete Category"
                itemName={category.name}
                message={
                    category.children && category.children.length > 0
                        ? `"${category.name}" has ${category.children.length} sub-categor${category.children.length === 1 ? 'y' : 'ies'}. Deleting it will require removing or reassigning sub-categories first.`
                        : undefined
                }
            />
        </div>
    );
}