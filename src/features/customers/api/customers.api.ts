import { apiClient } from '@/lib/api/client';
import {
    Customer,
    CustomerListParams,
    CustomerListResponse,
    CreateCustomerPayload,
    UpdateCustomerInput,
    Address,
    CustomerNote,
    CustomerActivity,
    CustomerPreference,
    CustomerCart,
} from '@/types/customer.types';

export const customersApi = {
    /** Customer record for an auth user id (orders store customerId = auth user id). */
    getByUserId: async (userId: string): Promise<Customer> => {
        const data = await apiClient.get<Customer>(`/customers/user/${userId}`);
        return data;
    },

    /** Saved cart of a signed-in shopper — keyed by auth user id (customer.userId), not customer.id. */
    getCart: async (userId: string): Promise<CustomerCart> => {
        const data = await apiClient.get<CustomerCart>(`/cart/user/${userId}`);
        return data;
    },

    list: async (params?: CustomerListParams): Promise<CustomerListResponse> => {
        const data = await apiClient.get<CustomerListResponse>('/customers', { params });
        return data;
    },

    get: async (id: string): Promise<Customer> => {
        const data = await apiClient.get<Customer>(`/customers/${id}`);
        return data;
    },

    getByEmail: async (email: string): Promise<Customer> => {
        const data = await apiClient.get<Customer>(`/customers/email/${email}`);
        return data;
    },

    search: async (query: string, limit = 20): Promise<{ query: string; count: number; customers: Customer[] }> => {
        const data = await apiClient.get<{ query: string; count: number; customers: Customer[] }>('/customers/search', { params: { q: query, limit } });
        return data;
    },

    create: async (input: CreateCustomerPayload): Promise<Customer> => {
        const data = await apiClient.post<Customer>('/customers', input);
        return data;
    },

    update: async (id: string, input: UpdateCustomerInput): Promise<any> => {
        const data = await apiClient.put<Customer>(`/customers/${id}`, input);
        return data;
    },

    remove: async (id: string): Promise<void> => {
        await apiClient.delete(`/customers/${id}`);
    },

    removeMany: async (ids: string[]): Promise<void> => {
        await apiClient.delete('/customers/bulk', { data: { ids } });
    },

    export: async (params?: CustomerListParams): Promise<Blob> => {
        const data = await apiClient.get<Blob>('/customers/export/csv', {
            params,
            responseType: 'blob',
        });
        return data;
    },

    // Addresses
    getAddresses: async (customerId: string): Promise<Address[]> => {
        const data = await apiClient.get<Address[]>(`/customers/${customerId}/addresses`);
        return data;
    },

    addAddress: async (customerId: string, dto: Omit<Address, 'id' | 'customerId' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<Address> => {
        const data = await apiClient.post<Address>(`/customers/${customerId}/addresses`, dto);
        return data;
    },

    updateAddress: async (addressId: string, dto: Partial<Address>): Promise<Address | any> => {
        const data = await apiClient.put<Address>(`/customers/addresses/${addressId}`, dto);
        return data;
    },

    removeAddress: async (addressId: string): Promise<void> => {
        await apiClient.delete(`/customers/addresses/${addressId}`);
    },

    // Notes
    getNotes: async (customerId: string): Promise<CustomerNote[] | any> => {
        const data = await apiClient.get<CustomerNote[]>(`/customers/${customerId}/notes`);
        return data;
    },

    addNote: async (customerId: string, dto: {
        content: string;
        type?: string;
        isInternal?: boolean;
        isPinned?: boolean;
        authorId: string;  // Make sure this is required
    }): Promise<CustomerNote | any> => {
        console.log("dto", dto);
        const data = await apiClient.post<CustomerNote>(`/customers/${customerId}/notes`, dto);
        return data;
    },

    updateNote: async (noteId: string, dto: {
        content?: string;
        type?: string;
        isPinned?: boolean;
        isInternal?: boolean;
    }): Promise<CustomerNote | any> => {
        const data = await apiClient.put<CustomerNote>(`/customers/notes/${noteId}`, dto);
        return data;
    },

    deleteNote: async (noteId: string): Promise<void> => {
        await apiClient.delete(`/customers/notes/${noteId}`);
    },

    // Preferences
    getPreferences: async (customerId: string): Promise<CustomerPreference> => {
        const data = await apiClient.get<CustomerPreference>(`/customers/${customerId}/preferences`);
        return data;
    },

    updatePreferences: async (customerId: string, dto: Partial<CustomerPreference>): Promise<CustomerPreference> => {
        const data = await apiClient.patch<CustomerPreference>(`/customers/${customerId}/preferences`, dto);
        return data;
    },

    // Activities
    getActivities: async (customerId: string, limit = 20): Promise<CustomerActivity[]> => {
        const data = await apiClient.get<CustomerActivity[]>(`/customers/${customerId}/activities`, { params: { limit } });
        return data;
    },
};