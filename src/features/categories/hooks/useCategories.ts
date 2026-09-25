// src/features/categories/hooks/useCategories.ts
import {
    useMutation,
    useQuery,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { categoriesApi } from '../api/categories.api';
import { cloudinaryApi } from '@/lib/api/cloudinary';
import {
    Category,
    CategoryListParams,
    CreateCategoryPayload,
    UpdateCategoryInput,
} from '@/types/category.types';

const categoryKeys = {
    all: ['categories'] as const,
    lists: () => [...categoryKeys.all, 'list'] as const,
    list: (params?: CategoryListParams) => [...categoryKeys.lists(), params] as const,
    details: () => [...categoryKeys.all, 'detail'] as const,
    detail: (id: string) => [...categoryKeys.details(), id] as const,
};

export const useCategories = (params?: CategoryListParams) => {
    return useQuery({
        queryKey: categoryKeys.list(params),
        queryFn: () => categoriesApi.list(params),
        placeholderData: keepPreviousData,
    });
};

export const useCategory = (id: string | undefined) => {
    return useQuery({
        queryKey: categoryKeys.detail(id ?? ''),
        queryFn: () => categoriesApi.get(id as string),
        enabled: Boolean(id),
    });
};

export const useCreateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateCategoryPayload) => categoriesApi.create(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
        },
    });
};


export const useUpdateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
            categoriesApi.update(id, input),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
            queryClient.invalidateQueries({ queryKey: categoryKeys.detail(variables.id) });
        },
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => categoriesApi.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
        },
    });
};

export const useDeleteCategories = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (ids: string[]) => categoriesApi.removeMany(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
        },
    });
};

export const useExportCategories = () => {
    return useMutation({
        mutationFn: (params?: CategoryListParams) => categoriesApi.export(params),
    });
};

export const useImageUpload = () => {
    return useMutation({
        mutationFn: (file: File) => cloudinaryApi.uploadImage(file),
    });
};

export const flattenCategories = (
    categories: Category[] = [],
    depth = 0
): Array<{ id: string; name: string; depth: number }> => {
    return categories.flatMap((category) => [
        { id: category.id, name: category.name, depth },
        ...flattenCategories(category.children ?? [], depth + 1),
    ]);
};

