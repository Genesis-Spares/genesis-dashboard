import { apiClient } from '@/lib/api/client';

// Money fields are Postgres decimals and arrive as strings.
export interface DeliveryZone {
    id: string;
    name: string;
    description: string | null;
    cities: string[];
    isDefault: boolean;
    fee: string | number;
    perKgFee: string | number;
    includedKg: string | number;
    freeAbove: string | number | null;
    minDays: number;
    maxDays: number;
    allowsCod: boolean;
    isActive: boolean;
    sortOrder: number;
}

export interface DeliveryZoneInput {
    name: string;
    description?: string;
    cities: string[];
    isDefault: boolean;
    fee: number;
    perKgFee: number;
    includedKg: number;
    freeAbove: number | null;
    minDays: number;
    maxDays: number;
    allowsCod: boolean;
    isActive: boolean;
    sortOrder: number;
}

export interface CheckoutSettings {
    vatRate: number;
    vatOnShipping: boolean;
    updatedAt?: string;
    updatedBy?: string | null;
}

export const deliveryApi = {
    zones: (): Promise<DeliveryZone[]> => apiClient.get<DeliveryZone[]>('/settings/delivery-zones'),
    createZone: (body: DeliveryZoneInput) => apiClient.post<DeliveryZone>('/settings/delivery-zones', body),
    updateZone: (id: string, body: DeliveryZoneInput) => apiClient.put<DeliveryZone>(`/settings/delivery-zones/${id}`, body),
    deleteZone: (id: string) => apiClient.delete<{ success: boolean }>(`/settings/delivery-zones/${id}`),
    settings: (): Promise<CheckoutSettings> => apiClient.get<CheckoutSettings>('/settings/checkout'),
    updateSettings: (body: { vatRate?: number; vatOnShipping?: boolean }) =>
        apiClient.patch<CheckoutSettings>('/settings/checkout', body),
};
