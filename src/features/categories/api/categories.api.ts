// src/features/categories/api/categories.api.ts
import axios from 'axios';
import { apiClient } from '@/lib/api/client';
import {
    Category,
    CategoryListParams,
    CreateCategoryPayload,
    UpdateCategoryInput,
    DeleteCategoriesResponse,
} from '@/types/category.types';

export const categoriesApi = {
    list: (params?: CategoryListParams) =>
        apiClient.get<Category[]>('/categories', params),

    get: (id: string) => apiClient.get<Category>(`/categories/${id}`),

    create: (input: CreateCategoryPayload) =>
        apiClient.post<Category>('/categories', input),

    update: (id: string, input: UpdateCategoryInput) =>
        apiClient.put<Category>(`/categories/${id}`, input),

    remove: (id: string) => apiClient.delete<{ id: string }>(`/categories/${id}`),

    removeMany: (ids: string[]) =>
        apiClient.delete<DeleteCategoriesResponse>('/categories/bulk', { ids }),

    export: (params?: CategoryListParams) =>
        apiClient.get<Blob>('/categories/export', { ...params, responseType: 'blob' }),
};