import {
    useMutation,
    useQuery,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { customersApi } from '../api/customers.api';
import {
    CustomerListParams,
    CreateCustomerPayload,
    UpdateCustomerInput,
    CustomerPreference,
    Address,
} from '@/types/customer.types';

const customerKeys = {
    all: ['customers'] as const,
    lists: () => [...customerKeys.all, 'list'] as const,
    list: (params?: CustomerListParams) => [...customerKeys.lists(), params] as const,
    details: () => [...customerKeys.all, 'detail'] as const,
    detail: (id: string) => [...customerKeys.details(), id] as const,
    addresses: (id: string) => [...customerKeys.detail(id), 'addresses'] as const,
    notes: (id: string) => [...customerKeys.detail(id), 'notes'] as const,
    preferences: (id: string) => [...customerKeys.detail(id), 'preferences'] as const,
    activities: (id: string) => [...customerKeys.detail(id), 'activities'] as const,
    cart: (userId: string) => [...customerKeys.all, 'cart', userId] as const,
    byUser: (userId: string) => [...customerKeys.all, 'by-user', userId] as const,
};

export const useCustomers = (params?: CustomerListParams) => {
    return useQuery({
        queryKey: customerKeys.list(params),
        queryFn: () => customersApi.list(params),
        placeholderData: keepPreviousData,
    });
};

export const useCustomer = (id: string | undefined) => {
    return useQuery({
        queryKey: customerKeys.detail(id ?? ''),
        queryFn: () => customersApi.get(id as string),
        enabled: Boolean(id),
    });
};

export const useCreateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateCustomerPayload) => customersApi.create(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
        },
    });
};

export const useUpdateCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateCustomerInput }) =>
            customersApi.update(id, input),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
            queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
        },
    });
};

export const useDeleteCustomer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => customersApi.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
        },
    });
};

export const useDeleteCustomers = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (ids: string[]) => customersApi.removeMany(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
        },
    });
};

export const useExportCustomers = () => {
    return useMutation({
        mutationFn: (params?: CustomerListParams) => customersApi.export(params),
    });
};

export const useCustomerAddresses = (customerId: string | undefined) => {
    return useQuery({
        queryKey: customerKeys.addresses(customerId ?? ''),
        queryFn: () => customersApi.getAddresses(customerId as string),
        enabled: Boolean(customerId),
    });
};

export const useCustomerNotes = (customerId: string | undefined) => {
    return useQuery({
        queryKey: customerKeys.notes(customerId ?? ''),
        queryFn: () => customersApi.getNotes(customerId as string),
        enabled: Boolean(customerId),
    });
};

export const useAddCustomerNote = (customerId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: { content: string; type?: string; isInternal?: boolean; isPinned?: boolean, authorId: string }) =>
            customersApi.addNote(customerId, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: customerKeys.notes(customerId) });
        },
    });
};

export const useUpdateCustomerNote = (customerId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ noteId, dto }: {
            noteId: string;
            dto: {
                content?: string;
                type?: string;
                isPinned?: boolean;
                isInternal?: boolean;
            }
        }) => customersApi.updateNote(noteId, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: customerKeys.notes(customerId) });
        },
        onError: (error) => {
            console.error('❌ Error updating note:', error);
        },
    });
};

export const useDeleteCustomerNote = (customerId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (noteId: string) => customersApi.deleteNote(noteId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: customerKeys.notes(customerId) });
        },
        onError: (error) => {
            console.error('❌ Error deleting note:', error);
        },
    });
};

export const useCustomerPreferences = (customerId: string | undefined) => {
    return useQuery({
        queryKey: customerKeys.preferences(customerId ?? ''),
        queryFn: () => customersApi.getPreferences(customerId as string),
        enabled: Boolean(customerId),
    });
};

export const useCustomerActivities = (customerId: string | undefined, limit = 20) => {
    return useQuery({
        queryKey: [...customerKeys.activities(customerId ?? ''), limit],
        queryFn: () => customersApi.getActivities(customerId as string, limit),
        enabled: Boolean(customerId),
    });
};

export const useAddAddress = (customerId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: Omit<Address, 'id' | 'customerId' | 'createdAt' | 'updatedAt' | 'isActive'>) =>
            customersApi.addAddress(customerId, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: customerKeys.addresses(customerId) });
        },
    });
};

export const useUpdateAddress = (customerId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ addressId, dto }: { addressId: string; dto: Partial<Address> }) =>
            customersApi.updateAddress(addressId, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: customerKeys.addresses(customerId) });
        },
    });
};

export const useDeleteAddress = (customerId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (addressId: string) => customersApi.removeAddress(addressId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: customerKeys.addresses(customerId) });
        },
    });
};

export const useUpdateCustomerPreferences = (customerId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: Partial<CustomerPreference>) => customersApi.updatePreferences(customerId, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: customerKeys.preferences(customerId) });
        },
    });
};
export const useCustomerCart = (userId: string | undefined) => {
    return useQuery({
        queryKey: customerKeys.cart(userId ?? ''),
        queryFn: () => customersApi.getCart(userId as string),
        enabled: Boolean(userId),
        refetchInterval: 60_000, // carts change while the shopper browses
    });
};

export const useCustomerByUserId = (userId: string | undefined, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: customerKeys.byUser(userId ?? ''),
        queryFn: () => customersApi.getByUserId(userId as string),
        enabled: Boolean(userId) && (options?.enabled ?? true),
        retry: false, // 404 = shopper has no customer record yet
    });
};
