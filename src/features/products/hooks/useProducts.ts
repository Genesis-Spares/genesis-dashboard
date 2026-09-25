import {
    useMutation,
    useQuery,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { productsApi } from '../api/products.api';
import {
    ProductListParams,
    CreateProductPayload,
    UpdateProductInput,
} from '@/types/product.types';

const productKeys = {
    all: ['products'] as const,
    lists: () => [...productKeys.all, 'list'] as const,
    list: (params?: ProductListParams) => [...productKeys.lists(), params] as const,
    details: () => [...productKeys.all, 'detail'] as const,
    detail: (id: string) => [...productKeys.details(), id] as const,
};

export const useProducts = (params?: ProductListParams, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: productKeys.list(params),
        queryFn: () => productsApi.list(params),
        placeholderData: keepPreviousData,
        enabled: options?.enabled ?? true,
    });
};

export const useProduct = (id: string | undefined) => {
    return useQuery({
        queryKey: productKeys.detail(id ?? ''),
        queryFn: () => productsApi.get(id as string),
        enabled: Boolean(id),
    });
};

export const useCreateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateProductPayload) => productsApi.create(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
        },
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
            productsApi.update(id, input),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
            queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
        },
    });
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => productsApi.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
        },
    });
};

export const useDeleteProducts = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (ids: string[]) => productsApi.removeMany(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
        },
    });
};

export const useExportProducts = () => {
    return useMutation({
        mutationFn: (params?: ProductListParams) => productsApi.export(params),
    });
};

export const useUpdateInventory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, stockQty }: { id: string; stockQty: number }) =>
            productsApi.updateInventory(id, stockQty),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
            queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
        },
    });
};