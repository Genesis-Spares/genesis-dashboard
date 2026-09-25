import { apiClient } from '@/lib/api/client'; // adjust to wherever your axios instance lives
import {
    Product,
    ProductListParams,
    ProductListResponse,
    CreateProductPayload,
    UpdateProductInput,
} from '@/types/product.types';

function extractData<T>(res: any): T {
    if (res && typeof res === 'object' && 'data' in res && 'success' in res) {
        return res.data;
    }
    return res;
}

export const productsApi = {
    list: async (params?: ProductListParams): Promise<ProductListResponse> => {
        const res = await apiClient.get<any>('/products', { params });
        return extractData<ProductListResponse>(res);
    },

    get: async (id: string): Promise<Product> => {
        const res = await apiClient.get<any>(`/products/${id}`);
        return extractData<Product>(res);
    },

    getBySlug: async (slug: string): Promise<Product> => {
        const res = await apiClient.get<any>(`/products/slug/${slug}`);
        return extractData<Product>(res);
    },

    create: async (input: CreateProductPayload): Promise<Product> => {
        const res = await apiClient.post<any>('/products', input);
        return extractData<Product>(res);
    },

    update: async (id: string, input: UpdateProductInput): Promise<Product> => {
        const res = await apiClient.put<any>(`/products/${id}`, input);
        return extractData<Product>(res);
    },

    remove: async (id: string): Promise<{ success: boolean; message: string }> => {
        const res = await apiClient.delete<any>(`/products/${id}`);
        return extractData<{ success: boolean; message: string }>(res);
    },

    // Your ProductsController doesn't expose a bulk-delete route yet —
    // this falls back to N individual deletes until you add one.
    removeMany: async (ids: string[]): Promise<void> => {
        await Promise.all(ids.map((id) => apiClient.delete(`/products/${id}`)));
    },

    updateInventory: async (id: string, stockQty: number): Promise<Product> => {
        const res = await apiClient.patch<any>(`/products/${id}/inventory`, { stockQty });
        return extractData<Product>(res);
    },

    // Also not in the controller shown — add a GET /products/export
    // (CSV stream) route on the backend if you want this to work.
    export: async (params?: ProductListParams): Promise<Blob> => {
        const res = await apiClient.get<Blob>('/products/export', {
            params,
            responseType: 'blob',
        });
        return extractData<Blob>(res);
    },
};